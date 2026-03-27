import { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct } from '../api';
import { ImageUploader } from '../components/common/ImageUploader';
import type { Product } from '../types';

const EMPTY_PRODUCT: Partial<Product> = { name: '', price: 0, description: '', channels: [], imageUrl: '' };
const CHANNEL_OPTIONS = ['자사 사이트', '스마트스토어', '아이디어스', '기타'];

const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;

export function ProductPage({ siteId }: { siteId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY_PRODUCT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!siteId) return;
    getProducts(siteId)
      .then((data: { products: Product[] }) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const selected = products.find((p) => p.id === selectedId) || null;

  const handleSave = async () => {
    if (!editing.name) { setError('상품명을 입력하세요.'); return; }
    setSaving(true);
    setError('');
    try {
      const data = await saveProduct({ siteId, product: editing });
      if (editing.id) {
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? data.product : p)));
      } else {
        setProducts((prev) => [...prev, data.product]);
      }
      setSelectedId(data.product.id);
      setEditing(EMPTY_PRODUCT);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct({ siteId, productId: id });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  const startEdit = (p?: Product) => {
    setEditing(p ? { ...p } : EMPTY_PRODUCT);
    setSelectedId(p?.id || null);
  };

  const toggleChannel = (ch: string) => {
    const channels = editing.channels || [];
    setEditing({ ...editing, channels: channels.includes(ch) ? channels.filter((c) => c !== ch) : [...channels, ch] });
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>불러오는 중...</div>;

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%' }}>
      {/* Left: Product List + Add Form */}
      <div style={{ width: 320, borderRight: '1px solid #e2e8f0', overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>상품 목록</h2>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{products.length}개</span>
          </div>
        </div>

        {/* Product List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedId(p.id); setEditing(EMPTY_PRODUCT); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
                border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', cursor: 'pointer',
                background: selectedId === p.id ? '#eff6ff' : '#fff',
                borderLeft: selectedId === p.id ? '3px solid #2563eb' : '3px solid transparent',
                transition: 'background 0.15s', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { if (selectedId !== p.id) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { if (selectedId !== p.id) e.currentTarget.style.background = '#fff'; }}
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📦</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{p.price ? `${p.price.toLocaleString()}원` : ''}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Add Button */}
        <div style={{ padding: 12, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={() => startEdit()} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: '1px dashed #cbd5e1',
            background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + 새 상품 추가
          </button>
        </div>
      </div>

      {/* Right: Detail / Edit / Consultant */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
        {/* Editing Mode */}
        {editing.name !== undefined && (editing.id || editing === EMPTY_PRODUCT) ? null : null}

        {editing !== EMPTY_PRODUCT && editing.name !== '' ? (
          /* Edit Form */
          <div style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editing.id ? '상품 수정' : '새 상품 추가'}</h3>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
              <label style={labelStyle}>상품명 *</label>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="예: 미니 크로스백" style={inputStyle} />

              <label style={labelStyle}>가격 (원)</label>
              <input type="number" value={editing.price || ''} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} placeholder="89000" style={inputStyle} />

              <label style={labelStyle}>상품 설명</label>
              <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="상품에 대한 상세 설명" />

              <label style={labelStyle}>판매 채널</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {CHANNEL_OPTIONS.map((ch) => (
                  <button key={ch} onClick={() => toggleChannel(ch)} style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
                    background: (editing.channels || []).includes(ch) ? '#2563eb' : '#f1f5f9',
                    color: (editing.channels || []).includes(ch) ? '#fff' : '#475569', border: 'none',
                  }}>{ch}</button>
                ))}
              </div>

              <label style={labelStyle}>상품 이미지</label>
              <ImageUploader siteId={siteId} currentUrl={editing.imageUrl} onUploaded={(url) => setEditing({ ...editing, imageUrl: url })} />
            </div>

            {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {saving ? '저장 중...' : editing.id ? '수정 완료' : '상품 추가'}
              </button>
              <button onClick={() => { setEditing(EMPTY_PRODUCT); }} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
                취소
              </button>
            </div>
          </div>
        ) : selected ? (
          /* Detail View */
          <div style={{ padding: 24 }}>
            {/* Product Detail */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1e293b' }}>{selected.name}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => startEdit(selected)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 12, cursor: 'pointer' }}>✏️ 수정</button>
                  <button onClick={() => handleDelete(selected.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#dc2626' }}>🗑 삭제</button>
                </div>
              </div>

              {selected.imageUrl && (
                <img src={selected.imageUrl} alt={selected.name} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>가격</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{selected.price ? `${selected.price.toLocaleString()}원` : '미설정'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>판매 채널</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(selected.channels || []).length > 0 ? selected.channels.map((ch) => (
                      <span key={ch} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#eff6ff', color: '#2563eb' }}>{ch}</span>
                    )) : <span style={{ fontSize: 12, color: '#94a3b8' }}>미설정</span>}
                  </div>
                </div>
              </div>

              {selected.description && (
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>상품 설명</div>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.description}</p>
                </div>
              )}
            </div>

            {/* Consultant Comment */}
            <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>💬</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>컨설턴트 코멘트</span>
              </div>
              <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>
                아직 등록된 코멘트가 없습니다. 컨설팅 진행 시 상품에 대한 전문가 의견이 여기에 표시됩니다.
              </p>
            </div>

            {/* AI Analysis Placeholder */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🤖</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>AI 분석</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: '#94a3b8', fontWeight: 600 }}>준비 중</span>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                키워드 경쟁력, 추천 가격대, SEO 최적화 제안 등 AI 기반 분석이 제공될 예정입니다.
              </p>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13, flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 32 }}>📦</span>
            <span>좌측에서 상품을 선택하거나 새로 추가하세요</span>
          </div>
        )}
      </div>
    </div>
  );
}
