import { useState } from 'react';
import type { HeadSnippets } from '../../types';

const tabBtnStyle = (active: boolean) => ({
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  border: 'none',
  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
  background: 'none',
  color: active ? '#2563eb' : '#64748b',
  cursor: 'pointer',
} as const);

const placeholderImg = {
  width: '100%',
  height: 160,
  background: '#f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  fontSize: 24,
  borderBottom: '1px solid #e2e8f0',
} as const;

const cardWrapper = {
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fff',
  maxWidth: 420,
} as const;

interface Props {
  snippets: HeadSnippets;
  siteId: string;
}

function ImageOrPlaceholder({ src, height = 160 }: { src?: string; height?: number }) {
  if (src) {
    return (
      <div style={{ width: '100%', height, overflow: 'hidden', borderBottom: '1px solid #e2e8f0' }}>
        <img src={src} alt="og preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return <div style={{ ...placeholderImg, height }}>🖼️</div>;
}

function GeneralPreview({ snippets, siteId }: Props) {
  const title = snippets.ogTitle || '사이트 제목을 입력하세요';
  const desc = snippets.ogDescription || '사이트 설명이 여기에 표시됩니다...';

  return (
    <div style={cardWrapper}>
      <ImageOrPlaceholder src={snippets.ogImage} />
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{siteId}.aiseo.tips</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function TwitterPreview({ snippets, siteId }: Props) {
  const title = snippets.twitterTitle || snippets.ogTitle || '사이트 제목을 입력하세요';
  const desc = snippets.twitterDescription || snippets.ogDescription || '사이트 설명이 여기에 표시됩니다...';
  const image = snippets.twitterImage || snippets.ogImage;
  const isLarge = (snippets.twitterCard || 'summary_large_image') === 'summary_large_image';

  if (!isLarge) {
    return (
      <div style={{ ...cardWrapper, display: 'flex' }}>
        <div style={{ width: 120, minWidth: 120, height: 120, overflow: 'hidden', borderRight: '1px solid #e2e8f0' }}>
          {image ? (
            <img src={image} alt="twitter preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 20 }}>🖼️</div>
          )}
        </div>
        <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1419', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#536471', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</div>
          <div style={{ fontSize: 11, color: '#536471' }}>{siteId}.aiseo.tips</div>
        </div>
      </div>
    );
  }

  return (
    <div style={cardWrapper}>
      <ImageOrPlaceholder src={image} height={200} />
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1419', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#536471', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</div>
        <div style={{ fontSize: 11, color: '#536471' }}>{siteId}.aiseo.tips</div>
      </div>
    </div>
  );
}

function FacebookPreview({ snippets, siteId }: Props) {
  const title = snippets.ogTitle || '사이트 제목을 입력하세요';
  const desc = snippets.ogDescription || '사이트 설명이 여기에 표시됩니다...';

  return (
    <div style={{ ...cardWrapper, borderRadius: 0, border: '1px solid #dadde1' }}>
      <ImageOrPlaceholder src={snippets.ogImage} height={210} />
      <div style={{ padding: '10px 12px', background: '#f2f3f5', borderTop: '1px solid #dadde1' }}>
        <div style={{ fontSize: 11, color: '#606770', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.03em' }}>{siteId}.aiseo.tips</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1d2129', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#606770', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</div>
      </div>
    </div>
  );
}

function KakaoPreview({ snippets, siteId }: Props) {
  const title = snippets.ogTitle || '사이트 제목을 입력하세요';
  const desc = snippets.ogDescription || '사이트 설명이 여기에 표시됩니다...';

  return (
    <div style={{ ...cardWrapper, borderRadius: 12, border: '1px solid #e5e5e5' }}>
      <ImageOrPlaceholder src={snippets.ogImage} height={180} />
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</div>
        <div style={{ fontSize: 11, color: '#b2b2b2' }}>{siteId}.aiseo.tips</div>
      </div>
    </div>
  );
}

type PreviewTab = 'general' | 'twitter' | 'facebook' | 'kakao';

export function OgPreviewCards({ snippets, siteId }: Props) {
  const [tab, setTab] = useState<PreviewTab>('general');

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>소셜 미리보기</h3>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
        <button style={tabBtnStyle(tab === 'general')} onClick={() => setTab('general')}>일반</button>
        <button style={tabBtnStyle(tab === 'twitter')} onClick={() => setTab('twitter')}>트위터</button>
        <button style={tabBtnStyle(tab === 'facebook')} onClick={() => setTab('facebook')}>페이스북</button>
        <button style={tabBtnStyle(tab === 'kakao')} onClick={() => setTab('kakao')}>카카오</button>
      </div>

      {tab === 'general' && <GeneralPreview snippets={snippets} siteId={siteId} />}
      {tab === 'twitter' && <TwitterPreview snippets={snippets} siteId={siteId} />}
      {tab === 'facebook' && <FacebookPreview snippets={snippets} siteId={siteId} />}
      {tab === 'kakao' && <KakaoPreview snippets={snippets} siteId={siteId} />}

      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
        실제 플랫폼에서의 표시와 다를 수 있습니다
      </div>
    </div>
  );
}
