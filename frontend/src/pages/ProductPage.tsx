import { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct } from '../api';
import { CardItem } from '../components/common/CardItem';
import { ImageUploader } from '../components/common/ImageUploader';
import type { Product } from '../types';

const EMPTY_PRODUCT: Partial<Product> = { name: '', price: 0, description: '', channels: [], imageUrl: '' };
const CHANNEL_OPTIONS = ['자사 사이트', '스마트스토어', '아이디어스', '기타'];

const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;

export function ProductPage({ siteId }: { siteId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  const toggleChannel = (ch: string) => {
    const channels = editing.channels || [];
    setEditing({ ...editing, channels: channels.includes(ch) ? channels.filter((c) => c !== ch) : [...channels, ch] });
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>불러오는 중...</div>;

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%' }}>
      {/* Left: Form */}
      <div style={{ width: 400, borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: 24, background: '#fff' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          {editing.id ? '상품 수정' : '상품 추가'}
        </h2>

        <label style={labelStyle}>상품명 *</label>
        <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="예: 미니 크로스백" style={inputStyle} />

        <label style={labelStyle}>가격 (원)</label>
        <input type="number" value={editing.price || ''} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} placeholder="89000" style={inputStyle} />

        <label style={labelStyle}>상품 설명</label>
        <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="상품에 대한 상세 설명" />

        <label style={labelStyle}>판매 채널</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {CHANNEL_OPTIONS.map((ch) => (
            <button
              key={ch}
              onClick={() => toggleChannel(ch)}
              style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
                background: (editing.channels || []).includes(ch) ? '#2563eb' : '#f1f5f9',
                color: (editing.channels || []).includes(ch) ? '#fff' : '#475569',
                border: 'none',
              }}
            >
              {ch}
            </button>
          ))}
        </div>

        <label style={labelStyle}>상품 이미지</label>
        <ImageUploader siteId={siteId} currentUrl={editing.imageUrl} onUploaded={(url) => setEditing({ ...editing, imageUrl: url })} />
        <div style={{ marginBottom: 12 }} />

        {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? '저장 중...' : editing.id ? '수정 완료' : '상품 추가'}
          </button>
          {editing.id && (
            <button onClick={() => setEditing(EMPTY_PRODUCT)} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
              취소
            </button>
          )}
        </div>
      </div>

      {/* Right: Product Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8fafc' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 16 }}>
          등록된 상품 ({products.length})
        </h3>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
            아직 등록된 상품이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {products.map((p) => (
              <CardItem
                key={p.id}
                title={p.name}
                subtitle={p.description}
                meta={p.price ? `${p.price.toLocaleString()}원` : undefined}
                imageUrl={p.imageUrl}
                onEdit={() => setEditing(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
