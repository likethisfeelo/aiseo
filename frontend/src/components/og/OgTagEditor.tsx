import { useState } from 'react';
import { ImageUploader } from '../common/ImageUploader';
import type { HeadSnippets } from '../../types';

const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 8 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;

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

interface Props {
  snippets: HeadSnippets;
  siteId: string;
  onChange: (snippets: HeadSnippets) => void;
}

export function OgTagEditor({ snippets, siteId, onChange }: Props) {
  const [tab, setTab] = useState<'general' | 'twitter'>('general');

  const update = (field: keyof HeadSnippets, value: string) => {
    onChange({ ...snippets, [field]: value });
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>OG 태그 설정</h3>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
        <button style={tabBtnStyle(tab === 'general')} onClick={() => setTab('general')}>기본 OG 태그</button>
        <button style={tabBtnStyle(tab === 'twitter')} onClick={() => setTab('twitter')}>트위터 카드</button>
      </div>

      {tab === 'general' && (
        <div>
          <label style={labelStyle}>OG 제목 (og:title)</label>
          <input
            value={snippets.ogTitle || ''}
            onChange={(e) => update('ogTitle', e.target.value)}
            placeholder="페이지 제목을 입력하세요"
            style={inputStyle}
            maxLength={100}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: -4, marginBottom: 8, textAlign: 'right' }}>
            {(snippets.ogTitle || '').length}/100
          </div>

          <label style={labelStyle}>OG 설명 (og:description)</label>
          <textarea
            value={snippets.ogDescription || ''}
            onChange={(e) => update('ogDescription', e.target.value)}
            placeholder="페이지 설명을 입력하세요"
            style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }}
            maxLength={200}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: -4, marginBottom: 8, textAlign: 'right' }}>
            {(snippets.ogDescription || '').length}/200
          </div>

          <label style={labelStyle}>OG 이미지 (og:image)</label>
          <input
            value={snippets.ogImage || ''}
            onChange={(e) => update('ogImage', e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={inputStyle}
          />
          <ImageUploader
            siteId={siteId}
            currentUrl={snippets.ogImage}
            onUploaded={(url) => update('ogImage', url)}
            label="이미지 업로드"
          />
          <div style={{ height: 8 }} />

          <label style={labelStyle}>페이지 타입 (og:type)</label>
          <select
            value={snippets.ogType || 'website'}
            onChange={(e) => update('ogType', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="website">website</option>
            <option value="article">article</option>
          </select>

          <label style={labelStyle}>키워드 (meta keywords)</label>
          <input
            value={snippets.metaKeywords || ''}
            onChange={(e) => update('metaKeywords', e.target.value)}
            placeholder="키워드1, 키워드2, 키워드3"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: -4, marginBottom: 8 }}>
            쉼표(,)로 구분하여 입력하세요
          </div>
        </div>
      )}

      {tab === 'twitter' && (
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, padding: 10, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            비워두면 기본 OG 태그 값이 자동으로 사용됩니다.
          </div>

          <label style={labelStyle}>카드 타입 (twitter:card)</label>
          <select
            value={snippets.twitterCard || 'summary_large_image'}
            onChange={(e) => update('twitterCard', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="summary_large_image">summary_large_image (큰 이미지)</option>
            <option value="summary">summary (작은 이미지)</option>
          </select>

          <label style={labelStyle}>트위터 제목 (twitter:title)</label>
          <input
            value={snippets.twitterTitle || ''}
            onChange={(e) => update('twitterTitle', e.target.value)}
            placeholder={snippets.ogTitle || '(기본 OG 값 사용)'}
            style={inputStyle}
          />

          <label style={labelStyle}>트위터 설명 (twitter:description)</label>
          <textarea
            value={snippets.twitterDescription || ''}
            onChange={(e) => update('twitterDescription', e.target.value)}
            placeholder={snippets.ogDescription || '(기본 OG 값 사용)'}
            style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }}
          />

          <label style={labelStyle}>트위터 이미지 (twitter:image)</label>
          <input
            value={snippets.twitterImage || ''}
            onChange={(e) => update('twitterImage', e.target.value)}
            placeholder={snippets.ogImage || '(기본 OG 값 사용)'}
            style={inputStyle}
          />
          <ImageUploader
            siteId={siteId}
            currentUrl={snippets.twitterImage || snippets.ogImage}
            onUploaded={(url) => update('twitterImage', url)}
            label="트위터 이미지 업로드"
          />
        </div>
      )}
    </div>
  );
}
