import { useState, useEffect } from 'react';
import { getServices, saveService, deleteService } from '../api';
import { CardItem } from '../components/common/CardItem';
import type { Service } from '../types';

const EMPTY_SERVICE: Partial<Service> = { name: '', type: '', price: 0, description: '', schedule: '' };
const SERVICE_TYPES = ['원데이 클래스', '정규 수업', '1:1 컨설팅', '그룹 워크숍', '온라인 강의', '기타'];

const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;

export function ServicePage({ siteId }: { siteId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Partial<Service>>(EMPTY_SERVICE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!siteId) return;
    getServices(siteId)
      .then((data: { services: Service[] }) => setServices(data.services || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleSave = async () => {
    if (!editing.name) { setError('서비스명을 입력하세요.'); return; }
    setSaving(true);
    setError('');
    try {
      const data = await saveService({ siteId, service: editing });
      if (editing.id) {
        setServices((prev) => prev.map((s) => (s.id === editing.id ? data.service : s)));
      } else {
        setServices((prev) => [...prev, data.service]);
      }
      setEditing(EMPTY_SERVICE);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService({ siteId, serviceId: id });
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>불러오는 중...</div>;

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%' }}>
      {/* Left: Form */}
      <div style={{ width: 400, borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: 24, background: '#fff' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          {editing.id ? '서비스 수정' : '서비스 추가'}
        </h2>

        <label style={labelStyle}>서비스명 *</label>
        <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="예: 가죽 공예 원데이 클래스" style={inputStyle} />

        <label style={labelStyle}>유형</label>
        <select value={editing.type || ''} onChange={(e) => setEditing({ ...editing, type: e.target.value })} style={inputStyle}>
          <option value="">선택</option>
          {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={labelStyle}>가격 (원)</label>
        <input type="number" value={editing.price || ''} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} placeholder="65000" style={inputStyle} />

        <label style={labelStyle}>일정/운영 시간</label>
        <input value={editing.schedule || ''} onChange={(e) => setEditing({ ...editing, schedule: e.target.value })} placeholder="예: 매주 토요일 14:00-17:00" style={inputStyle} />

        <label style={labelStyle}>서비스 설명</label>
        <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="서비스에 대한 상세 설명" />

        {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? '저장 중...' : editing.id ? '수정 완료' : '서비스 추가'}
          </button>
          {editing.id && (
            <button onClick={() => setEditing(EMPTY_SERVICE)} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
              취소
            </button>
          )}
        </div>
      </div>

      {/* Right: Service List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8fafc' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 16 }}>
          등록된 서비스 ({services.length})
        </h3>
        {services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
            아직 등록된 서비스가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {services.map((s) => (
              <CardItem
                key={s.id}
                title={s.name}
                subtitle={`${s.type || ''}${s.schedule ? ` · ${s.schedule}` : ''}`}
                meta={s.price ? `${s.price.toLocaleString()}원` : undefined}
                onEdit={() => setEditing(s)}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
