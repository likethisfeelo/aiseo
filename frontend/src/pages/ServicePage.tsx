import { useState, useEffect } from 'react';
import { getServices, saveService, deleteService } from '../api';
import type { Service } from '../types';

const EMPTY_SERVICE: Partial<Service> = { name: '', type: '', price: 0, description: '', schedule: '' };
const SERVICE_TYPES = ['원데이 클래스', '정규 수업', '1:1 컨설팅', '그룹 워크숍', '온라인 강의', '기타'];

const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;

export function ServicePage({ siteId }: { siteId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selected = services.find((s) => s.id === selectedId) || null;

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
      setSelectedId(data.service.id);
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
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  const startEdit = (s?: Service) => {
    setEditing(s ? { ...s } : EMPTY_SERVICE);
    setSelectedId(s?.id || null);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>불러오는 중...</div>;

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%' }}>
      {/* Left: Service List */}
      <div style={{ width: 320, borderRight: '1px solid #e2e8f0', overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>서비스 목록</h2>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{services.length}개</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedId(s.id); setEditing(EMPTY_SERVICE); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
                border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', cursor: 'pointer',
                background: selectedId === s.id ? '#eff6ff' : '#fff',
                borderLeft: selectedId === s.id ? '3px solid #2563eb' : '3px solid transparent',
                transition: 'background 0.15s', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { if (selectedId !== s.id) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { if (selectedId !== s.id) e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f0fdf4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.type}{s.price ? ` · ${s.price.toLocaleString()}원` : ''}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={() => startEdit()} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: '1px dashed #cbd5e1',
            background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + 새 서비스 추가
          </button>
        </div>
      </div>

      {/* Right: Detail / Edit / Consultant */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
        {editing !== EMPTY_SERVICE && editing.name !== '' ? (
          <div style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editing.id ? '서비스 수정' : '새 서비스 추가'}</h3>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
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
            </div>

            {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {saving ? '저장 중...' : editing.id ? '수정 완료' : '서비스 추가'}
              </button>
              <button onClick={() => setEditing(EMPTY_SERVICE)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        ) : selected ? (
          <div style={{ padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1e293b' }}>{selected.name}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => startEdit(selected)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 12, cursor: 'pointer' }}>✏️ 수정</button>
                  <button onClick={() => handleDelete(selected.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#dc2626' }}>🗑 삭제</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>유형</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{selected.type || '미설정'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>가격</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{selected.price ? `${selected.price.toLocaleString()}원` : '미설정'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>일정</div>
                  <div style={{ fontSize: 13, color: '#475569' }}>{selected.schedule || '미설정'}</div>
                </div>
              </div>

              {selected.description && (
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>서비스 설명</div>
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
                아직 등록된 코멘트가 없습니다. 컨설팅 진행 시 서비스에 대한 전문가 의견이 여기에 표시됩니다.
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
                서비스 가격 적정성, 경쟁 분석, 마케팅 키워드 제안 등 AI 기반 분석이 제공될 예정입니다.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13, flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 32 }}>🎓</span>
            <span>좌측에서 서비스를 선택하거나 새로 추가하세요</span>
          </div>
        )}
      </div>
    </div>
  );
}
