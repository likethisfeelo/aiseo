import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminGetSite, adminCreateComment, getComments, saveSiteSettings } from '../../api';
import type { Brand, HeadSnippets, Product, Service, Store } from '../../types';

interface SiteData {
  siteId: string;
  ownerEmail: string;
  brand: Brand;
  products: Product[];
  services: Service[];
  store: Store;
  brandCompleteness: number;
  headSnippets?: HeadSnippets;
  updatedAt?: string;
}

interface Comment {
  commentId: string;
  targetType: string;
  targetId: string | null;
  authorName: string;
  type: string;
  content: string;
  suggestedValue: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  opinion: { label: '의견', icon: '💬' },
  suggestion: { label: '수정 제안', icon: '🟡' },
  correction: { label: '수정사항', icon: '🔴' },
};

function CommentForm({ siteId, targetType, targetId, onCreated }: {
  siteId: string; targetType: string; targetId?: string; onCreated: () => void;
}) {
  const [type, setType] = useState<'opinion' | 'suggestion' | 'correction'>('opinion');
  const [content, setContent] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await adminCreateComment({
        siteId, targetType, targetId,
        type, content: content.trim(),
        suggestedValue: suggestedValue.trim() || undefined,
      });
      setContent('');
      setSuggestedValue('');
      onCreated();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning-soft)', borderRadius: 8, padding: 12, marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['opinion', 'suggestion', 'correction'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: type === t ? 700 : 400,
            background: type === t ? 'var(--warning)' : '#fff', color: type === t ? 'var(--warning-dark)' : 'var(--warning-dark)',
            border: '1px solid var(--warning-soft)', cursor: 'pointer', fontFamily: 'inherit',
          }}>{TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}</button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="코멘트 내용을 입력하세요..."
        style={{ width: '100%', padding: 8, border: '1px solid var(--warning-soft)', borderRadius: 6, fontSize: 13, minHeight: 60, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
      />
      {type === 'suggestion' && (
        <input
          value={suggestedValue}
          onChange={(e) => setSuggestedValue(e.target.value)}
          placeholder="제안 값 (예: 79,000원)"
          style={{ width: '100%', padding: 8, border: '1px solid var(--warning-soft)', borderRadius: 6, fontSize: 13, marginTop: 6, boxSizing: 'border-box' }}
        />
      )}
      <button onClick={handleSubmit} disabled={saving || !content.trim()} style={{
        marginTop: 8, padding: '6px 16px', borderRadius: 6, border: 'none',
        background: 'var(--warning)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>{saving ? '저장 중...' : '코멘트 작성'}</button>
    </div>
  );
}

// Head snippet 필드 표 — 마케팅/검증 코드를 관리자에서 한 눈에 보고
// 문제가 있을 때 필드 단위로 즉시 클리어. 변경은 backend site-settings
// POST 핸들러를 admin 권한으로 호출 (deactivated 사이트도 통과).
const HEAD_SNIPPET_FIELDS: Array<{
  key: keyof HeadSnippets;
  label: string;
  hint: string;
  format?: (v: string) => string;
}> = [
  { key: 'ga4Id', label: 'GA4 측정 ID', hint: 'G-XXXXXXXXXX' },
  { key: 'googleAdsId', label: 'Google Ads 전환 ID', hint: 'AW-XXXXXXXXX' },
  { key: 'gscMeta', label: 'GSC 메타', hint: '<meta google-site-verification>', format: (v) => v.replace(/^<meta\s+name="google-site-verification"\s+content="([^"]+)"\s*\/?>$/, '$1') },
  { key: 'naverMeta', label: 'Naver 메타', hint: '<meta naver-site-verification>' },
  { key: 'gtmId', label: 'GTM', hint: 'GTM-XXXXXXX' },
  { key: 'metaPixelId', label: 'Meta Pixel', hint: '15~16자리 숫자' },
  { key: 'kakaoPixelId', label: 'Kakao Pixel', hint: 'Pixel ID' },
  { key: 'customHead', label: 'Custom <head>', hint: '자유 HTML' },
];

function HeadSnippetsCard({ site, onReload }: { site: SiteData; onReload: () => void }) {
  const [busyKey, setBusyKey] = useState<keyof HeadSnippets | ''>('');
  const [msg, setMsg] = useState('');
  const snippets = site.headSnippets || {};

  const clearField = async (key: keyof HeadSnippets) => {
    const label = HEAD_SNIPPET_FIELDS.find((f) => f.key === key)?.label || key;
    if (!confirm(`"${label}" 값을 지우시겠습니까?\n사용자 측에서 즉시 반영되며, 다음 prod 배포 시 해당 코드가 사이트에서 제거됩니다.`)) return;
    setBusyKey(key);
    setMsg('');
    try {
      // 다른 필드는 유지하고 해당 키만 비움
      const next: HeadSnippets = { ...snippets, [key]: '' };
      await saveSiteSettings({ siteId: site.siteId, headSnippets: next });
      setMsg(`${label} 지움 완료`);
      onReload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '처리 실패');
    } finally {
      setBusyKey('');
    }
  };

  const clearAll = async () => {
    if (!confirm('이 사이트의 모든 head snippets 를 초기화하시겠습니까?\nGA4, GTM, Meta Pixel, GSC/Naver 메타 등이 모두 제거됩니다.')) return;
    setBusyKey('ga4Id'); // 표시용
    setMsg('');
    try {
      const cleared: HeadSnippets = Object.fromEntries(HEAD_SNIPPET_FIELDS.map((f) => [f.key, ''])) as HeadSnippets;
      await saveSiteSettings({ siteId: site.siteId, headSnippets: { ...snippets, ...cleared } });
      setMsg('전체 초기화 완료');
      onReload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '처리 실패');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Head Snippets (마케팅 · 검증 코드)
        </h3>
        <button onClick={clearAll} disabled={!!busyKey} style={{
          padding: '4px 10px', borderRadius: 6, border: '1px solid var(--danger-soft)',
          background: '#fff', color: 'var(--danger)', fontSize: 11, fontWeight: 600,
          cursor: busyKey ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: busyKey ? 0.6 : 1,
        }}>전체 초기화</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
        사용자가 직접 등록한 마케팅·검증 코드입니다. 잘못된 GSC 토큰이나 의심스러운 custom head 가 있으면 해당 필드만 지울 수 있습니다.
        {site.updatedAt && <> · 마지막 수정 {new Date(site.updatedAt).toLocaleString('ko-KR')}</>}
      </div>
      {msg && (
        <div style={{
          padding: 8, borderRadius: 6, marginBottom: 10, fontSize: 12,
          background: msg.includes('실패') ? 'var(--danger-soft)' : 'var(--success-soft)',
          color: msg.includes('실패') ? 'var(--danger-dark)' : 'var(--success-dark)',
        }}>{msg}</div>
      )}
      <div style={{ display: 'grid', gap: 6 }}>
        {HEAD_SNIPPET_FIELDS.map((f) => {
          const raw = (snippets[f.key] || '') as string;
          const display = raw ? (f.format ? f.format(raw) : raw) : '';
          const set = !!raw;
          return (
            <div key={f.key} style={{
              display: 'grid', gridTemplateColumns: '140px 1fr 80px',
              gap: 10, alignItems: 'center',
              padding: '8px 10px', borderRadius: 6,
              background: set ? 'var(--bg-soft)' : 'transparent',
              border: '1px solid var(--border-soft)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {f.label}
              </div>
              <div style={{
                fontSize: 12, fontFamily: set ? 'monospace' : 'inherit',
                color: set ? 'var(--text-primary)' : 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={set ? raw : ''}>
                {set ? display : `미설정 · ${f.hint}`}
              </div>
              <button
                onClick={() => clearField(f.key)}
                disabled={!set || !!busyKey}
                style={{
                  padding: '4px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                  fontFamily: 'inherit',
                  border: set ? '1px solid var(--danger-soft)' : '1px solid var(--border-soft)',
                  background: '#fff',
                  color: set ? 'var(--danger)' : 'var(--text-muted)',
                  cursor: set && !busyKey ? 'pointer' : 'not-allowed',
                  opacity: busyKey === f.key ? 0.6 : 1,
                }}
              >
                {busyKey === f.key ? '...' : '지우기'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>코멘트 없음</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {comments.map((c) => (
        <div key={c.commentId} style={{ padding: 10, borderRadius: 6, background: 'var(--warning-soft)', border: '1px solid var(--warning-soft)', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <span>{TYPE_CONFIG[c.type]?.icon || '💬'}</span>
            <span style={{ fontWeight: 600, color: 'var(--warning-dark)' }}>{c.authorName}</span>
            <span style={{ color: 'var(--accent-dark)', marginLeft: 'auto', fontSize: 11 }}>{new Date(c.createdAt).toLocaleDateString('ko')}</span>
          </div>
          <p style={{ color: 'var(--warning-dark)', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
          {c.suggestedValue && <div style={{ marginTop: 4, padding: '4px 8px', background: '#fff', borderRadius: 4, color: 'var(--text-primary)' }}>제안: {c.suggestedValue}</div>}
        </div>
      ))}
    </div>
  );
}

export function AdminSiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<SiteData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComment, setActiveComment] = useState<{ targetType: string; targetId?: string } | null>(null);

  const loadData = async () => {
    if (!siteId) return;
    try {
      const [siteData, commentsData] = await Promise.all([
        adminGetSite(siteId),
        getComments(siteId),
      ]);
      setSite(siteData.site);
      setComments(commentsData.comments || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [siteId]);

  const getCommentsFor = (targetType: string, targetId?: string) =>
    comments.filter((c) => c.targetType === targetType && (!targetId || c.targetId === targetId));

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>불러오는 중...</div>;
  if (!site) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>사이트를 찾을 수 없습니다.</div>;

  const SectionHeader = ({ title, targetType, targetId }: { title: string; targetType: string; targetId?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      <button onClick={() => setActiveComment(
        activeComment?.targetType === targetType && activeComment?.targetId === targetId ? null : { targetType, targetId }
      )} style={{
        padding: '4px 10px', borderRadius: 6, border: '1px solid var(--warning-soft)', background: 'var(--warning-soft)',
        fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--warning-dark)', fontFamily: 'inherit',
      }}>💬 코멘트 추가</button>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit' }}>
        ← 사이트 목록으로
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>🔧 {site.siteId}</h2>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--border-soft)', padding: '4px 10px', borderRadius: 6 }}>{site.ownerEmail}</span>
        <span style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '4px 10px', borderRadius: 6 }}>완성도 {site.brandCompleteness || 0}%</span>
      </div>

      {/* Head Snippets (admin oversight + per-field clear) */}
      <HeadSnippetsCard site={site} onReload={loadData} />

      {/* Brand Section */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
        <SectionHeader title="브랜드 관리" targetType="brand" />
        {site.brand?.name ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>이름</span><br />{site.brand.name} ({site.brand.nameEn})</div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>한 줄 소개</span><br />{site.brand.tagline || '-'}</div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>업종</span><br />{site.brand.industry || '-'}</div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>사업 유형</span><br />{site.brand.businessType || '-'}</div>
          </div>
        ) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>브랜드 정보가 입력되지 않았습니다.</p>}
        <CommentList comments={getCommentsFor('brand')} />
        {activeComment?.targetType === 'brand' && !activeComment?.targetId && (
          <CommentForm siteId={site.siteId} targetType="brand" onCreated={loadData} />
        )}
      </div>

      {/* Products Section */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
        <SectionHeader title={`상품 관리 (${(site.products || []).length})`} targetType="product" />
        {(site.products || []).length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>등록된 상품이 없습니다.</p>
        ) : (
          (site.products || []).map((p) => (
            <div key={p.id} style={{ padding: 12, border: '1px solid var(--border-soft)', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name} <span style={{ color: 'var(--primary)', fontWeight: 400 }}>{p.price ? `${p.price.toLocaleString()}원` : ''}</span></div>
                <button onClick={() => setActiveComment(
                  activeComment?.targetId === p.id ? null : { targetType: 'product', targetId: p.id }
                )} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--warning-soft)', background: 'var(--warning-soft)', fontSize: 10, cursor: 'pointer', color: 'var(--warning-dark)', fontFamily: 'inherit' }}>💬</button>
              </div>
              {p.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{p.description}</p>}
              <CommentList comments={getCommentsFor('product', p.id)} />
              {activeComment?.targetType === 'product' && activeComment?.targetId === p.id && (
                <CommentForm siteId={site.siteId} targetType="product" targetId={p.id} onCreated={loadData} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Services Section */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
        <SectionHeader title={`서비스 관리 (${(site.services || []).length})`} targetType="service" />
        {(site.services || []).length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>등록된 서비스가 없습니다.</p>
        ) : (
          (site.services || []).map((s) => (
            <div key={s.id} style={{ padding: 12, border: '1px solid var(--border-soft)', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name} <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12 }}>{s.type}</span></div>
                <button onClick={() => setActiveComment(
                  activeComment?.targetId === s.id ? null : { targetType: 'service', targetId: s.id }
                )} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--warning-soft)', background: 'var(--warning-soft)', fontSize: 10, cursor: 'pointer', color: 'var(--warning-dark)', fontFamily: 'inherit' }}>💬</button>
              </div>
              <CommentList comments={getCommentsFor('service', s.id)} />
              {activeComment?.targetType === 'service' && activeComment?.targetId === s.id && (
                <CommentForm siteId={site.siteId} targetType="service" targetId={s.id} onCreated={loadData} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Store Section */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
        <SectionHeader title="매장 관리" targetType="store" />
        {site.store?.address ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>주소</span><br />{site.store.address}</div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>전화</span><br />{site.store.phone || '-'}</div>
          </div>
        ) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>매장 정보가 입력되지 않았습니다.</p>}
        <CommentList comments={getCommentsFor('store')} />
        {activeComment?.targetType === 'store' && (
          <CommentForm siteId={site.siteId} targetType="store" onCreated={loadData} />
        )}
      </div>
    </div>
  );
}
