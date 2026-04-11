import { useState, useEffect, useCallback } from 'react';
import { getBrand, saveBrand } from '../api';
import { useAutoSave } from '../hooks/useAutoSave';
import { AutoSaveIndicator } from '../components/common/AutoSaveIndicator';
import { TagChip, AddTagButton } from '../components/common/TagChip';
import { ImageUploader } from '../components/common/ImageUploader';
import { ProgressRing } from '../components/common/ProgressRing';
import type { Brand } from '../types';

const EMPTY_BRAND: Brand = {
  name: '', nameEn: '', tagline: '', industry: '', businessType: '',
  colors: [], tone: [], logo: '',
  story: { origin: '', values: '', customerMessage: '' },
  target: { audience: '', profiles: [], keywords: [] },
};

const INDUSTRIES = ['공방/수공예', '사진/스튜디오', '교육/레슨', '뷰티/미용', '카페/베이커리', 'F&B/외식', '의료/건강', 'IT/디자인', '기타'];
const BUSINESS_TYPES = ['1인 사업자', '소규모 팀', '프리랜서', '법인', '기타'];
const TONE_OPTIONS = ['따뜻한', '전문적인', '감성적인', '모던한', '친근한', '럭셔리한', '자연스러운', '깔끔한'];

function calcCompleteness(b: Brand): number {
  const fields = [b.name, b.nameEn, b.tagline, b.industry, b.businessType, b.logo, b.story.origin, b.story.values, b.target.audience];
  const filled = fields.filter(Boolean).length;
  const hasColors = b.colors.length > 0 ? 1 : 0;
  const hasTone = b.tone.length > 0 ? 1 : 0;
  const hasKeywords = b.target.keywords.length > 0 ? 1 : 0;
  return Math.round(((filled + hasColors + hasTone + hasKeywords) / 12) * 100);
}

const inputStyle = { width: '100%', padding: 8, border: '1px solid var(--border-strong)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 } as const;

export function BrandPage({ siteId }: { siteId: string }) {
  const [brand, setBrand] = useState<Brand>(EMPTY_BRAND);
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [tagField, setTagField] = useState<'tone' | 'keywords' | null>(null);

  useEffect(() => {
    if (!siteId) return;
    getBrand(siteId)
      .then((data: { brand: Brand }) => setBrand({ ...EMPTY_BRAND, ...data.brand }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const doSave = useCallback(async (data: Brand) => {
    await saveBrand({ siteId, brand: data });
  }, [siteId]);

  const { saving, lastSaved, error: saveError, save: manualSave } = useAutoSave({ data: brand, saveFn: doSave, enabled: !loading && !!siteId });

  const update = <K extends keyof Brand>(key: K, value: Brand[K]) =>
    setBrand((prev) => ({ ...prev, [key]: value }));

  const updateStory = (key: keyof Brand['story'], value: string) =>
    setBrand((prev) => ({ ...prev, story: { ...prev.story, [key]: value } }));

  const updateTarget = (key: keyof Brand['target'], value: string) =>
    setBrand((prev) => ({ ...prev, target: { ...prev.target, [key]: value } }));

  const addTag = (field: 'tone' | 'keywords', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (field === 'tone') {
      if (!brand.tone.includes(trimmed)) update('tone', [...brand.tone, trimmed]);
    } else {
      const current = brand.target.keywords;
      if (!current.includes(trimmed)) setBrand((prev) => ({ ...prev, target: { ...prev.target, keywords: [...current, trimmed] } }));
    }
  };

  const removeTag = (field: 'tone' | 'keywords', value: string) => {
    if (field === 'tone') update('tone', brand.tone.filter((t) => t !== value));
    else setBrand((prev) => ({ ...prev, target: { ...prev.target, keywords: prev.target.keywords.filter((k) => k !== value) } }));
  };

  const completeness = calcCompleteness(brand);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>불러오는 중...</div>;

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%' }}>
      {/* Left: Edit Form */}
      <div style={{ width: 400, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: 24, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>브랜드 관리</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AutoSaveIndicator saving={saving} lastSaved={lastSaved} error={saveError} />
            <button onClick={manualSave} disabled={saving} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-strong)', background: '#fff', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <label style={labelStyle}>브랜드 이름 *</label>
        <input value={brand.name} onChange={(e) => update('name', e.target.value)} placeholder="예: TYBD 스튜디오" style={inputStyle} />

        <label style={labelStyle}>영문 이름</label>
        <input value={brand.nameEn} onChange={(e) => update('nameEn', e.target.value)} placeholder="예: TYBD Studio" style={inputStyle} />

        <label style={labelStyle}>한 줄 소개 *</label>
        <input value={brand.tagline} onChange={(e) => update('tagline', e.target.value)} placeholder="예: 천안 핸드메이드 가죽 가방 공방" style={inputStyle} />

        {/* Industry & Type */}
        <label style={labelStyle}>업종</label>
        <select value={brand.industry} onChange={(e) => update('industry', e.target.value)} style={inputStyle}>
          <option value="">선택</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>

        <label style={labelStyle}>사업 유형</label>
        <select value={brand.businessType} onChange={(e) => update('businessType', e.target.value)} style={inputStyle}>
          <option value="">선택</option>
          {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Colors */}
        <label style={labelStyle}>브랜드 컬러</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {brand.colors.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: c, border: '1px solid var(--border-strong)' }} />
              <input
                value={c}
                onChange={(e) => {
                  const next = [...brand.colors];
                  next[i] = e.target.value;
                  update('colors', next);
                }}
                style={{ width: 72, padding: 4, fontSize: 11, border: '1px solid var(--border-strong)', borderRadius: 4 }}
              />
              <button onClick={() => update('colors', brand.colors.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
          ))}
          {brand.colors.length < 3 && (
            <button onClick={() => update('colors', [...brand.colors, 'var(--primary)'])} style={{ width: 28, height: 28, borderRadius: 6, border: '1px dashed var(--text-muted)', background: 'var(--bg-soft)', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>+</button>
          )}
        </div>

        {/* Tone */}
        <label style={labelStyle}>톤/무드</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {TONE_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => brand.tone.includes(t) ? removeTag('tone', t) : addTag('tone', t)}
              style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
                background: brand.tone.includes(t) ? 'var(--primary)' : 'var(--border-soft)',
                color: brand.tone.includes(t) ? '#fff' : 'var(--text-secondary)',
                border: 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {brand.tone.filter((t) => !TONE_OPTIONS.includes(t)).map((t) => (
            <TagChip key={t} label={t} onRemove={() => removeTag('tone', t)} />
          ))}
          <AddTagButton onClick={() => setTagField('tone')} />
        </div>
        {tagField === 'tone' && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="직접 입력" style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              onKeyDown={(e) => { if (e.key === 'Enter') { addTag('tone', tagInput); setTagInput(''); setTagField(null); } }}
            />
            <button onClick={() => { addTag('tone', tagInput); setTagInput(''); setTagField(null); }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--primary)', background: 'var(--primary)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>추가</button>
          </div>
        )}

        {/* Logo */}
        <label style={labelStyle}>로고</label>
        <ImageUploader siteId={siteId} currentUrl={brand.logo} onUploaded={(url) => update('logo', url)} label="로고 업로드" />
        <div style={{ marginBottom: 12 }} />

        {/* Story */}
        <label style={labelStyle}>브랜드 탄생 배경</label>
        <textarea value={brand.story.origin} onChange={(e) => updateStory('origin', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="브랜드를 시작하게 된 이야기" />

        <label style={labelStyle}>핵심 가치</label>
        <textarea value={brand.story.values} onChange={(e) => updateStory('values', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="브랜드의 핵심 가치와 철학" />

        <label style={labelStyle}>고객에게 전하는 메시지</label>
        <textarea value={brand.story.customerMessage} onChange={(e) => updateStory('customerMessage', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="고객에게 전하고 싶은 한마디" />

        {/* Target */}
        <label style={labelStyle}>타겟 고객</label>
        <textarea value={brand.target.audience} onChange={(e) => updateTarget('audience', e.target.value)} style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} placeholder="예: 20-40대 핸드메이드 가죽 소품에 관심 있는 여성" />

        {/* SEO Keywords */}
        <label style={labelStyle}>SEO 키워드</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {brand.target.keywords.map((k) => (
            <TagChip key={k} label={k} onRemove={() => removeTag('keywords', k)} color="var(--accent-dark)" />
          ))}
          <AddTagButton onClick={() => setTagField('keywords')} />
        </div>
        {tagField === 'keywords' && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="키워드 입력" style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              onKeyDown={(e) => { if (e.key === 'Enter') { addTag('keywords', tagInput); setTagInput(''); setTagField(null); } }}
            />
            <button onClick={() => { addTag('keywords', tagInput); setTagInput(''); setTagField(null); }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--accent-dark)', background: 'var(--accent-dark)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>추가</button>
          </div>
        )}
      </div>

      {/* Right: Preview */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>미리보기</h3>
          <ProgressRing value={completeness} size={44} strokeWidth={4} />
        </div>

        {/* Preview Card */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', maxWidth: 380 }}>
          {brand.logo && (
            <div style={{ padding: 20, display: 'flex', justifyContent: 'center', background: 'var(--bg-soft)' }}>
              <img src={brand.logo} alt="logo" style={{ maxHeight: 64, objectFit: 'contain' }} />
            </div>
          )}
          <div style={{ padding: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)', fontFamily: "'Noto Serif KR', serif" }}>
              {brand.name || '브랜드 이름'}
            </h3>
            {brand.nameEn && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{brand.nameEn}</div>}
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{brand.tagline || '한 줄 소개가 여기에 표시됩니다'}</p>

            {brand.colors.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {brand.colors.map((c, i) => (
                  <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '1px solid var(--border)' }} />
                ))}
              </div>
            )}

            {brand.tone.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                {brand.tone.map((t) => (
                  <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--border-soft)', color: 'var(--text-secondary)' }}>{t}</span>
                ))}
              </div>
            )}

            {brand.industry && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {brand.industry} · {brand.businessType}
              </div>
            )}

            {brand.story.origin && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--warning-soft)', borderRadius: 6, fontSize: 13, color: 'var(--warning-dark)', lineHeight: 1.6 }}>
                {brand.story.origin}
              </div>
            )}

            {brand.target.keywords.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SEO 키워드</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {brand.target.keywords.map((k) => (
                    <span key={k} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--accent-dark)' }}>{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
