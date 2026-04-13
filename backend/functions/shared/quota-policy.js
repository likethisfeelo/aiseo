const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// ── Hard caps (enforced regardless of admin policy values) ──
const HARD_CAP_IMAGE_MB = Number(process.env.HARD_CAP_IMAGE_MB || 20);
const HARD_CAP_STORAGE_GB = Number(process.env.HARD_CAP_STORAGE_GB || 8);
const HARD_CAP_SITE_ZIP_MB = Number(process.env.HARD_CAP_SITE_ZIP_MB || 600);

const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

const POLICY_CONFIG_KEY = 'quota-policy';
const POLICY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cached = { at: 0, value: null };

// Default policy used when app-config table is empty or unreachable.
// These mirror the numbers agreed in the plan file.
const DEFAULT_POLICY = {
  activePolicy: 'normal', // "training" | "normal"
  trainingWindow: null, // { startAt: ISO, endAt: ISO } | null
  perUserTrainingDays: 7,
  policies: {
    training: {
      maxImageMB: 15,
      maxImages: 500,
      maxSiteZipMB: 500,
      maxTotalStorageMB: 5 * 1024, // 5 GB
      monthlyDeploys: null, // null => unlimited
      monthlyImagePuts: null,
      imageResize: { maxWidth: 2400, quality: 0.9 },
    },
    normal: {
      maxImageMB: 5,
      maxImages: 150,
      maxSiteZipMB: 150,
      maxTotalStorageMB: 1.5 * 1024, // 1.5 GB
      monthlyDeploys: 20,
      monthlyImagePuts: 200,
      imageResize: { maxWidth: 1600, quality: 0.85 },
    },
  },
};

const APP_CONFIG_TABLE = process.env.APP_CONFIG_TABLE || 'aiseo-app-config';

const clone = (value) => JSON.parse(JSON.stringify(value));

const clampHardCaps = (policyValue) => {
  const out = clone(policyValue);
  if (!out.maxImageMB || out.maxImageMB > HARD_CAP_IMAGE_MB) {
    out.maxImageMB = HARD_CAP_IMAGE_MB;
  }
  if (!out.maxTotalStorageMB || out.maxTotalStorageMB > HARD_CAP_STORAGE_GB * 1024) {
    out.maxTotalStorageMB = HARD_CAP_STORAGE_GB * 1024;
  }
  if (!out.maxSiteZipMB || out.maxSiteZipMB > HARD_CAP_SITE_ZIP_MB) {
    out.maxSiteZipMB = HARD_CAP_SITE_ZIP_MB;
  }
  return out;
};

const getAppConfig = async ({ bypassCache = false } = {}) => {
  const now = Date.now();
  if (!bypassCache && cached.value && now - cached.at < POLICY_CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const result = await ddb.send(
      new GetCommand({
        TableName: APP_CONFIG_TABLE,
        Key: { configKey: POLICY_CONFIG_KEY },
      }),
    );
    const stored = result.Item?.value;
    const merged = stored ? { ...DEFAULT_POLICY, ...stored, policies: { ...DEFAULT_POLICY.policies, ...(stored.policies || {}) } } : DEFAULT_POLICY;
    cached = { at: now, value: merged };
    return merged;
  } catch (err) {
    console.warn('quota-policy: failed to load app config, using defaults', err?.message || err);
    cached = { at: now, value: DEFAULT_POLICY };
    return DEFAULT_POLICY;
  }
};

const saveAppConfig = async (value) => {
  // Enforce hard caps on every write (defensive)
  const safeValue = clone(value || {});
  safeValue.policies = safeValue.policies || {};
  for (const mode of ['training', 'normal']) {
    safeValue.policies[mode] = clampHardCaps({
      ...DEFAULT_POLICY.policies[mode],
      ...(safeValue.policies[mode] || {}),
    });
  }
  safeValue.activePolicy = safeValue.activePolicy === 'training' ? 'training' : 'normal';
  safeValue.perUserTrainingDays = Number(safeValue.perUserTrainingDays || 7);

  await ddb.send(
    new PutCommand({
      TableName: APP_CONFIG_TABLE,
      Item: { configKey: POLICY_CONFIG_KEY, value: safeValue, updatedAt: new Date().toISOString() },
    }),
  );
  cached = { at: Date.now(), value: safeValue };
  return safeValue;
};

const isWithinWindow = (window, nowIso) => {
  if (!window || !window.startAt || !window.endAt) return false;
  return nowIso >= window.startAt && nowIso <= window.endAt;
};

const isWithinPerUserTraining = (userCreatedAt, perUserTrainingDays, now) => {
  if (!userCreatedAt || !perUserTrainingDays || perUserTrainingDays <= 0) return false;
  const createdMs = typeof userCreatedAt === 'string' ? Date.parse(userCreatedAt) : Number(userCreatedAt);
  if (!Number.isFinite(createdMs)) return false;
  return now - createdMs < perUserTrainingDays * 24 * 60 * 60 * 1000;
};

// Priority (highest first):
//   1. Global training window (admin-configured)
//   2. Per-user automatic training grace (first N days after signup)
//   3. activePolicy from app-config
//   4. Default "normal"
const resolveEffectivePolicy = (appConfig, { userCreatedAt } = {}, now = new Date()) => {
  const cfg = appConfig || DEFAULT_POLICY;
  const policies = cfg.policies || DEFAULT_POLICY.policies;
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  let mode = 'normal';
  let reason = 'default';

  if (cfg.activePolicy === 'training') {
    mode = 'training';
    reason = 'activePolicy=training';
  }
  if (isWithinPerUserTraining(userCreatedAt, cfg.perUserTrainingDays, nowMs)) {
    mode = 'training';
    reason = 'per-user-training-window';
  }
  if (isWithinWindow(cfg.trainingWindow, nowIso)) {
    mode = 'training';
    reason = 'global-training-window';
  }

  const base = policies[mode] || DEFAULT_POLICY.policies[mode] || DEFAULT_POLICY.policies.normal;
  const effective = clampHardCaps(base);

  return {
    mode,
    reason,
    policy: effective,
    hardCaps: {
      imageMB: HARD_CAP_IMAGE_MB,
      storageGB: HARD_CAP_STORAGE_GB,
      siteZipMB: HARD_CAP_SITE_ZIP_MB,
    },
  };
};

// Validate an upload against an effective policy + current usage.
// Returns { ok: true } or { ok: false, reason, code, details }.
//
// For siteId === 'blog' we only enforce hard caps (admin operating asset,
// not counted against per-user quota).
const validateUpload = ({
  kind, // "image" | "site-zip"
  siteId,
  fileSize, // bytes
  usage, // { storageBytes, imageCount, monthlyImagePuts, monthlyDeploys }
  effective, // output of resolveEffectivePolicy
}) => {
  const policy = effective.policy;
  const isBlog = siteId === 'blog';

  if (kind === 'image') {
    if (fileSize && fileSize > HARD_CAP_IMAGE_MB * MB) {
      return {
        ok: false,
        code: 'HARDCAP_IMAGE_SIZE',
        reason: `Image exceeds absolute limit of ${HARD_CAP_IMAGE_MB} MB`,
      };
    }
    if (fileSize && fileSize > policy.maxImageMB * MB) {
      return {
        ok: false,
        code: 'POLICY_IMAGE_SIZE',
        reason: `Image exceeds current policy limit of ${policy.maxImageMB} MB`,
      };
    }
    if (isBlog) return { ok: true };

    if (usage && typeof usage.imageCount === 'number' && usage.imageCount >= policy.maxImages) {
      return {
        ok: false,
        code: 'POLICY_IMAGE_COUNT',
        reason: `Image count exceeds current policy limit of ${policy.maxImages}`,
      };
    }
    if (
      usage &&
      policy.monthlyImagePuts !== null &&
      typeof usage.monthlyImagePuts === 'number' &&
      usage.monthlyImagePuts >= policy.monthlyImagePuts
    ) {
      return {
        ok: false,
        code: 'POLICY_MONTHLY_IMAGE_PUTS',
        reason: `Monthly image upload quota (${policy.monthlyImagePuts}) reached`,
      };
    }
    if (
      usage &&
      typeof usage.storageBytes === 'number' &&
      fileSize &&
      usage.storageBytes + fileSize > policy.maxTotalStorageMB * MB
    ) {
      return {
        ok: false,
        code: 'POLICY_TOTAL_STORAGE',
        reason: `Total storage would exceed ${policy.maxTotalStorageMB} MB`,
      };
    }
    return { ok: true };
  }

  if (kind === 'site-zip') {
    if (fileSize && fileSize > HARD_CAP_SITE_ZIP_MB * MB) {
      return {
        ok: false,
        code: 'HARDCAP_SITE_ZIP',
        reason: `Site ZIP exceeds absolute limit of ${HARD_CAP_SITE_ZIP_MB} MB`,
      };
    }
    if (fileSize && fileSize > policy.maxSiteZipMB * MB) {
      return {
        ok: false,
        code: 'POLICY_SITE_ZIP',
        reason: `Site ZIP exceeds current policy limit of ${policy.maxSiteZipMB} MB`,
      };
    }
    if (
      usage &&
      policy.monthlyDeploys !== null &&
      typeof usage.monthlyDeploys === 'number' &&
      usage.monthlyDeploys >= policy.monthlyDeploys
    ) {
      return {
        ok: false,
        code: 'POLICY_MONTHLY_DEPLOYS',
        reason: `Monthly deploy quota (${policy.monthlyDeploys}) reached`,
      };
    }
    if (
      usage &&
      typeof usage.storageBytes === 'number' &&
      fileSize &&
      usage.storageBytes + fileSize > policy.maxTotalStorageMB * MB
    ) {
      return {
        ok: false,
        code: 'POLICY_TOTAL_STORAGE',
        reason: `Total storage would exceed ${policy.maxTotalStorageMB} MB`,
      };
    }
    return { ok: true };
  }

  return { ok: true };
};

module.exports = {
  DEFAULT_POLICY,
  APP_CONFIG_TABLE,
  HARD_CAP_IMAGE_MB,
  HARD_CAP_STORAGE_GB,
  HARD_CAP_SITE_ZIP_MB,
  MB,
  GB,
  getAppConfig,
  saveAppConfig,
  resolveEffectivePolicy,
  validateUpload,
  clampHardCaps,
};
