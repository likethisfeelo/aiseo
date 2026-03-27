import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminGetSite, adminCreateComment, getComments } from '../../api';
import type { Brand, Product, Service, Store } from '../../types';

interface SiteData {
  siteId: string;
  ownerEmail: string;
  brand: Brand;
  products: Product[];
  services: Service[];
  store: Store;
  brandCompleteness: number;
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
    <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: 12, marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['opinion', 'suggestion', 'correction'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: type === t ? 700 : 400,
            background: type === t ? '#fbbf24' : '#fff', color: type === t ? '#78350f' : '#92400e',
            border: '1px solid #fde68a', cursor: 'pointer', fontFamily: 'inherit',
          }}>{TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}</button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="코멘트 내용을 입력하세요..."
        style={{ width: '100%', padding: 8, border: '1px solid #fde68a', borderRadius: 6, fontSize: 13, minHeight: 60, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
      />
      {type === 'suggestion' && (
        <input
          value={suggestedValue}
          onChange={(e) => setSuggestedValue(e.target.value)}
          placeholder="제안 값 (예: 79,000원)"
          style={{ width: '100%', padding: 8, border: '1px solid #fde68a', borderRadius: 6, fontSize: 13, marginTop: 6, boxSizing: 'border-box' }}
        />
      )}
      <button onClick={handleSubmit} disabled={saving || !content.trim()} style={{
        marginTop: 8, padding: '6px 16px', borderRadius: 6, border: 'none',
        background: '#d97706', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>{saving ? '저장 중...' : '코멘트 작성'}</button>
    </div>
  );
}

function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return <div style={{ fontSize: 12, color: '#94a3b8', padding: 8 }}>코멘트 없음</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {comments.map((c) => (
        <div key={c.commentId} style={{ padding: 10, borderRadius: 6, background: '#fefce8', border: '1px solid #fef3c7', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <span>{TYPE_CONFIG[c.type]?.icon || '💬'}</span>
            <span style={{ fontWeight: 600, color: '#92400e' }}>{c.authorName}</span>
            <span style={{ color: '#b4a06e', marginLeft: 'auto', fontSize: 11 }}>{new Date(c.createdAt).toLocaleDateString('ko')}</span>
          </div>
          <p style={{ color: '#78350f', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
          {c.suggestedValue && <div style={{ marginTop: 4, padding: '4px 8px', background: '#fff', borderRadius: 4, color: '#1e293b' }}>제안: {c.suggestedValue}</div>}
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>불러오는 중...</div>;
  if (!site) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>사이트를 찾을 수 없습니다.</div>;

  const SectionHeader = ({ title, targetType, targetId }: { title: string; targetType: string; targetId?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>
      <button onClick={() => setActiveComment(
        activeComment?.targetType === targetType && activeComment?.targetId === targetId ? null : { targetType, targetId }
      )} style={{
        padding: '4px 10px', borderRadius: 6, border: '1px solid #fde68a', background: '#fefce8',
        fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#92400e', fontFamily: 'inherit',
      }}>💬 코멘트 추가</button>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit' }}>
        ← 사이트 목록으로
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>🔧 {site.siteId}</h2>
        <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>{site.ownerEmail}</span>
        <span style={{ fontSize: 12, color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: 6 }}>완성도 {site.brandCompleteness || 0}%</span>
      </div>

      {/* Brand Section */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <SectionHeader title="브랜드 관리" targetType="brand" />
        {site.brand?.name ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: '#94a3b8', fontSize: 11 }}>이름</span><br />{site.brand.name} ({site.brand.nameEn})</div>
            <div><span style={{ color: '#94a3b8', fontSize: 11 }}>한 줄 소개</span><br />{site.brand.tagline || '-'}</div>
            <div><span style={{ color: '#94a3b8', fontSize: 11 }}>업종</span><br />{site.brand.industry || '-'}</div>
            <div><span style={{ color: '#94a3b8', fontSize: 11 }}>사업 유형</span><br />{site.brand.businessType || '-'}</div>
          </div>
        ) : <p style={{ fontSize: 13, color: '#94a3b8' }}>브랜드 정보가 입력되지 않았습니다.</p>}
        <CommentList comments={getCommentsFor('brand')} />
        {activeComment?.targetType === 'brand' && !activeComment?.targetId && (
          <CommentForm siteId={site.siteId} targetType="brand" onCreated={loadData} />
        )}
      </div>

      {/* Products Section */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <SectionHeader title={`상품 관리 (${(site.products || []).length})`} targetType="product" />
        {(site.products || []).length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8' }}>등록된 상품이 없습니다.</p>
        ) : (
          (site.products || []).map((p) => (
            <div key={p.id} style={{ padding: 12, border: '1px solid #f1f5f9', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name} <span style={{ color: '#2563eb', fontWeight: 400 }}>{p.price ? `${p.price.toLocaleString()}원` : ''}</span></div>
                <button onClick={() => setActiveComment(
                  activeComment?.targetId === p.id ? null : { targetType: 'product', targetId: p.id }
                )} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #fde68a', background: '#fefce8', fontSize: 10, cursor: 'pointer', color: '#92400e', fontFamily: 'inherit' }}>💬</button>
              </div>
              {p.description && <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{p.description}</p>}
              <CommentList comments={getCommentsFor('product', p.id)} />
              {activeComment?.targetType === 'product' && activeComment?.targetId === p.id && (
                <CommentForm siteId={site.siteId} targetType="product" targetId={p.id} onCreated={loadData} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Services Section */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <SectionHeader title={`서비스 관리 (${(site.services || []).length})`} targetType="service" />
        {(site.services || []).length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8' }}>등록된 서비스가 없습니다.</p>
        ) : (
          (site.services || []).map((s) => (
            <div key={s.id} style={{ padding: 12, border: '1px solid #f1f5f9', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name} <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>{s.type}</span></div>
                <button onClick={() => setActiveComment(
                  activeComment?.targetId === s.id ? null : { targetType: 'service', targetId: s.id }
                )} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #fde68a', background: '#fefce8', fontSize: 10, cursor: 'pointer', color: '#92400e', fontFamily: 'inherit' }}>💬</button>
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
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <SectionHeader title="매장 관리" targetType="store" />
        {site.store?.address ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><span style={{ color: '#94a3b8', fontSize: 11 }}>주소</span><br />{site.store.address}</div>
            <div><span style={{ color: '#94a3b8', fontSize: 11 }}>전화</span><br />{site.store.phone || '-'}</div>
          </div>
        ) : <p style={{ fontSize: 13, color: '#94a3b8' }}>매장 정보가 입력되지 않았습니다.</p>}
        <CommentList comments={getCommentsFor('store')} />
        {activeComment?.targetType === 'store' && (
          <CommentForm siteId={site.siteId} targetType="store" onCreated={loadData} />
        )}
      </div>
    </div>
  );
}
