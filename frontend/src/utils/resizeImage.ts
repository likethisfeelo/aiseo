// Client-side image resizer.
//
// Used before uploading to S3 so we (a) shave bytes off the transfer
// and the final S3 object, and (b) keep the backend Lambda off the
// hot path for image processing. The server still enforces a maximum
// size via shared/quota-policy.js, so a malicious caller can't bypass
// the limit by uploading raw files directly with curl.
//
// - Reads the file into an <img>, then paints it onto a <canvas>
//   scaled to `maxWidth` (preserving aspect ratio).
// - Encodes to JPEG at `quality` unless the source is already
//   something we shouldn't re-encode (SVG, or already under budget).
// - Returns a Blob you can pass straight into `fetch(uploadUrl, { body })`.
// - If anything goes wrong (CORS-tainted canvas, unsupported MIME,
//   resize output exceeds original) we fall back to the original file.

export interface ResizeOptions {
  maxWidth: number | null; // null => no resize
  quality: number; // 0..1
  mimeType?: string; // forces output MIME (default image/jpeg)
}

export interface ResizeResult {
  blob: Blob;
  originalBytes: number;
  resultBytes: number;
  mimeType: string;
  resized: boolean;
}

// File types we never attempt to re-encode — either because they're
// vector data (SVG) or because the browser encoder support is sparse.
const SKIP_MIME = new Set<string>(['image/svg+xml']);

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image for resize'));
    };
    img.src = url;
  });

const toBlob = (canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('canvas.toBlob returned null'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });

export async function resizeImage(
  file: File,
  options: ResizeOptions,
): Promise<ResizeResult> {
  const { maxWidth, quality, mimeType = 'image/jpeg' } = options;

  const fallback: ResizeResult = {
    blob: file,
    originalBytes: file.size,
    resultBytes: file.size,
    mimeType: file.type || 'application/octet-stream',
    resized: false,
  };

  if (!maxWidth || SKIP_MIME.has(file.type) || !file.type.startsWith('image/')) {
    return fallback;
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return fallback;
  }

  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;
  if (!srcWidth || !srcHeight) return fallback;

  // If the image already fits under maxWidth we skip the canvas pass
  // entirely — re-encoding would only introduce generation loss.
  if (srcWidth <= maxWidth) return fallback;

  const scale = maxWidth / srcWidth;
  const targetWidth = Math.round(srcWidth * scale);
  const targetHeight = Math.round(srcHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return fallback;

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  try {
    const blob = await toBlob(canvas, mimeType, quality);
    // Don't actually hand back a larger file than what the user had.
    if (blob.size >= file.size) return fallback;
    return {
      blob,
      originalBytes: file.size,
      resultBytes: blob.size,
      mimeType,
      resized: true,
    };
  } catch {
    return fallback;
  }
}

// Convenience helper for cases where the caller only has a policy
// object from useQuotaPolicy and wants a sensible default resize.
export async function resizeImageWithPolicy(
  file: File,
  policyResize: { maxWidth: number; quality: number } | null | false | undefined,
): Promise<ResizeResult> {
  if (!policyResize) {
    return {
      blob: file,
      originalBytes: file.size,
      resultBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      resized: false,
    };
  }
  return resizeImage(file, {
    maxWidth: policyResize.maxWidth,
    quality: policyResize.quality,
  });
}
