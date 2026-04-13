// React hook wrapping GET /quota/status.
//
// Components call this to render usage bars, pick the right resize
// settings before uploading, and show friendly error messages when a
// user hits a limit. The response shape mirrors
// backend/functions/quota-status/handler.js.

import { useEffect, useState, useCallback } from 'react';
import { getQuotaStatus } from '../api';

export interface QuotaPolicy {
  maxImageMB: number;
  maxImages: number;
  maxSiteZipMB: number;
  maxTotalStorageMB: number;
  monthlyDeploys: number | null;
  monthlyImagePuts: number | null;
  imageResize: { maxWidth: number; quality: number } | false | null;
}

export interface QuotaUsage {
  storageBytes: number;
  imageCount: number;
  monthlyDeploys: number;
  monthlyImagePuts: number;
  monthBucket: string | null;
}

export interface QuotaStatus {
  mode: 'training' | 'normal';
  reason: string;
  policy: QuotaPolicy;
  hardCaps: { imageMB: number; storageGB: number; siteZipMB: number };
  usage: QuotaUsage;
  remaining: {
    storageBytes: number;
    imageCount: number;
    monthlyDeploys: number | null;
    monthlyImagePuts: number | null;
  };
}

export function useQuotaPolicy(enabled = true) {
  const [data, setData] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string>('');

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const status = (await getQuotaStatus()) as QuotaStatus;
      setData(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quota status');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
