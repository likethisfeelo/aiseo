// GET /quota/status  — any authenticated user can read their own effective
// quota policy and current month's usage. Used by the frontend to render
// progress bars, pre-validate files, and pick the correct resize settings
// before asking the server for a signed upload URL.

const { ok, serverError } = require('../shared/response');
const { requireUser } = require('../shared/auth');
const { getAppConfig, resolveEffectivePolicy, MB } = require('../shared/quota-policy');
const { getUsage } = require('../shared/usage-tracker');

exports.handler = async (event) => {
  try {
    const { user, errorResponse } = requireUser(event);
    if (errorResponse) return errorResponse;

    const appConfig = await getAppConfig();
    const userCreatedAt = user.claims?.iat
      ? new Date(Number(user.claims.iat) * 1000).toISOString()
      : undefined;

    const effective = resolveEffectivePolicy(appConfig, { userCreatedAt });
    const usage = await getUsage(user.sub, { userCreatedAt });

    return ok(
      {
        mode: effective.mode,
        reason: effective.reason,
        policy: effective.policy,
        hardCaps: effective.hardCaps,
        usage: {
          storageBytes: usage?.storageBytes || 0,
          imageCount: usage?.imageCount || 0,
          monthlyDeploys: usage?.monthlyDeploys || 0,
          monthlyImagePuts: usage?.monthlyImagePuts || 0,
          monthBucket: usage?.monthBucket || null,
        },
        remaining: {
          storageBytes: Math.max(
            0,
            effective.policy.maxTotalStorageMB * MB - (usage?.storageBytes || 0),
          ),
          imageCount: Math.max(
            0,
            effective.policy.maxImages - (usage?.imageCount || 0),
          ),
          monthlyDeploys:
            effective.policy.monthlyDeploys === null
              ? null
              : Math.max(
                  0,
                  effective.policy.monthlyDeploys - (usage?.monthlyDeploys || 0),
                ),
          monthlyImagePuts:
            effective.policy.monthlyImagePuts === null
              ? null
              : Math.max(
                  0,
                  effective.policy.monthlyImagePuts - (usage?.monthlyImagePuts || 0),
                ),
        },
      },
      event,
    );
  } catch (error) {
    console.error('quota-status error', error);
    return serverError('Failed to load quota status', event);
  }
};
