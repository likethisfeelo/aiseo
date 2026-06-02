import { useRef, useState } from 'react';
import { createImageUploadUrl } from '../../api';
import { useQuotaPolicy } from '../../hooks/useQuotaPolicy';
import { resizeImageWithPolicy } from '../../utils/resizeImage';

interface Props {
  siteId: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
}

export function ImageUploader({ siteId, currentUrl, onUploaded, label = '이미지 업로드' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { data: quota, reload: reloadQuota } = useQuotaPolicy();

  const maxImageMB = quota?.policy.maxImageMB ?? 5;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('JPG, PNG, WebP, SVG 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > maxImageMB * 1024 * 1024) {
      setError(`파일 크기는 ${maxImageMB}MB 이하여야 합니다.`);
      return;
    }

    setUploading(true);
    setError('');
    try {
      // Resize client-side against the policy's maxWidth/quality so we
      // send smaller files to S3 and stay inside the per-user storage
      // quota. SVGs and already-small images pass through untouched.
      const resized = await resizeImageWithPolicy(file, quota?.policy.imageResize ?? null);

      let data;
      try {
        data = await createImageUploadUrl({
          siteId,
          fileName: file.name,
          fileType: resized.mimeType,
          fileSize: resized.resultBytes,
        });
      } catch (apiErr) {
        // 1단계: API Gateway 응답이 잡혔거나 (응답 본문 메시지), fetch
        // 자체가 TypeError("Failed to fetch") 로 죽었거나. 후자라면
        // 보통 (a) 옛 siteId 로 deactivated 가드에 막혔는데 캐시된
        // 응답이거나 (b) API Gateway/Lambda 가 cold-start 에서 죽어
        // CORS 헤더 없는 5xx 를 돌려준 케이스. 어느 쪽이든 사용자가
        // 다음 단계로 갈 수 있게 친절한 메시지로.
        const raw = apiErr instanceof Error ? apiErr.message : String(apiErr);
        const friendly = raw === 'Failed to fetch' || /TypeError/i.test(raw)
          ? `이미지 업로드 요청이 네트워크 단계에서 실패했어요 (siteId=${siteId}). 페이지를 새로고침해서 도메인이 최신인지 확인하거나 잠시 후 다시 시도해 주세요.`
          : raw;
        throw new Error(friendly);
      }

      const putRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': resized.mimeType },
        body: resized.blob,
      });
      if (!putRes.ok) {
        throw new Error(`S3 업로드 실패 (HTTP ${putRes.status}). 이미지 버킷의 CORS 설정을 확인해 주세요.`);
      }

      onUploaded(data.imageUrl);
      // Refresh quota so usage bars reflect the latest counts.
      reloadQuota();
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const remainingImages = quota?.remaining.imageCount;
  const remainingStorageMB = quota ? Math.floor(quota.remaining.storageBytes / (1024 * 1024)) : null;

  return (
    <div>
      {currentUrl && (
        <div style={{ marginBottom: 8 }}>
          <img
            src={currentUrl}
            alt="uploaded"
            style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6, objectFit: 'cover', border: '1px solid #e2e8f0' }}
          />
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          padding: '6px 14px',
          fontSize: 12,
          borderRadius: 6,
          border: '1px dashed #cbd5e1',
          background: '#f8fafc',
          color: '#475569',
          cursor: 'pointer',
        }}
      >
        {uploading ? '업로드 중...' : label}
      </button>
      {quota && siteId !== 'blog' && (
        <p style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
          {quota.mode === 'training' ? '교육 모드' : '기본 모드'} · 남은 이미지 {remainingImages} · 남은 용량 {remainingStorageMB} MB
        </p>
      )}
      {error && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{error}</p>}
    </div>
  );
}
