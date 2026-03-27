import { useState, useEffect, useCallback } from 'react';
import { getStore, saveStore } from '../api';
import { useAutoSave } from '../hooks/useAutoSave';
import { AutoSaveIndicator } from '../components/common/AutoSaveIndicator';
import type { Store } from '../types';

const EMPTY_STORE: Store = {
  address: '', phone: '',
  hours: { weekday: '', weekend: '', holiday: '' },
  sns: { instagram: '', blog: '', kakao: '' },
  platforms: { naverPlace: '', googleBusiness: '', smartStore: '' },
};

const DAYS = [
  { key: 'weekday', label: '평일' },
  { key: 'weekend', label: '주말' },
  { key: 'holiday', label: '공휴일' },
];

const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;

export function StorePage({ siteId }: { siteId: string }) {
  const [store, setStore] = useState<Store>(EMPTY_STORE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    getStore(siteId)
      .then((data: { store: Store }) => setStore({ ...EMPTY_STORE, ...data.store }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const doSave = useCallback(async (data: Store) => {
    await saveStore({ siteId, store: data });
  }, [siteId]);

  const { saving, lastSaved, error: saveError } = useAutoSave({ data: store, saveFn: doSave, enabled: !loading && !!siteId });

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>불러오는 중...</div>;

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%' }}>
      {/* Left: Form */}
      <div style={{ width: 400, borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: 24, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>매장 관리</h2>
          <AutoSaveIndicator saving={saving} lastSaved={lastSaved} error={saveError} />
        </div>

        {/* Basic */}
        <label style={labelStyle}>매장 주소</label>
        <input value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} placeholder="예: 충남 천안시 동남구 ..." style={inputStyle} />

        <label style={labelStyle}>전화번호</label>
        <input value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} placeholder="010-0000-0000" style={inputStyle} />

        {/* Hours */}
        <label style={{ ...labelStyle, marginBottom: 8 }}>운영 시간</label>
        {DAYS.map((d) => (
          <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', width: 40 }}>{d.label}</span>
            <input
              value={store.hours[d.key] || ''}
              onChange={(e) => setStore({ ...store, hours: { ...store.hours, [d.key]: e.target.value } })}
              placeholder="10:00 - 19:00"
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 12 }} />

        {/* SNS */}
        <label style={{ ...labelStyle, marginBottom: 8 }}>SNS 채널</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', width: 70 }}>Instagram</span>
          <input value={store.sns.instagram} onChange={(e) => setStore({ ...store, sns: { ...store.sns, instagram: e.target.value } })} placeholder="@username" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', width: 70 }}>Naver Blog</span>
          <input value={store.sns.blog} onChange={(e) => setStore({ ...store, sns: { ...store.sns, blog: e.target.value } })} placeholder="블로그 URL" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b', width: 70 }}>카카오 오픈챗</span>
          <input value={store.sns.kakao} onChange={(e) => setStore({ ...store, sns: { ...store.sns, kakao: e.target.value } })} placeholder="오픈챗 링크" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        </div>

        {/* Platforms */}
        <label style={{ ...labelStyle, marginBottom: 8 }}>플랫폼 등록</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', width: 100 }}>Naver Place</span>
          <input value={store.platforms.naverPlace} onChange={(e) => setStore({ ...store, platforms: { ...store.platforms, naverPlace: e.target.value } })} placeholder="URL" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', width: 100 }}>Google Business</span>
          <input value={store.platforms.googleBusiness} onChange={(e) => setStore({ ...store, platforms: { ...store.platforms, googleBusiness: e.target.value } })} placeholder="URL" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b', width: 100 }}>스마트스토어</span>
          <input value={store.platforms.smartStore} onChange={(e) => setStore({ ...store, platforms: { ...store.platforms, smartStore: e.target.value } })} placeholder="URL" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        </div>
      </div>

      {/* Right: Preview */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8fafc' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 16 }}>매장 정보 미리보기</h3>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, maxWidth: 380 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>주소</div>
              <div style={{ fontSize: 13, color: '#1e293b' }}>{store.address || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>전화</div>
              <div style={{ fontSize: 13, color: '#1e293b' }}>{store.phone || '-'}</div>
            </div>
          </div>

          <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>운영 시간</div>
            {DAYS.map((d) => (
              <div key={d.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 4 }}>
                <span>{d.label}</span>
                <span>{store.hours[d.key] || '-'}</span>
              </div>
            ))}
          </div>

          {(store.sns.instagram || store.sns.blog || store.sns.kakao) && (
            <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>SNS</div>
              {store.sns.instagram && <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 4 }}>Instagram: {store.sns.instagram}</div>}
              {store.sns.blog && <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 4 }}>Blog: {store.sns.blog}</div>}
              {store.sns.kakao && <div style={{ fontSize: 12, color: '#2563eb' }}>카카오: {store.sns.kakao}</div>}
            </div>
          )}

          <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>플랫폼 등록 현황</div>
            {(['naverPlace', 'googleBusiness', 'smartStore'] as const).map((key) => {
              const labels = { naverPlace: 'Naver Place', googleBusiness: 'Google Business', smartStore: '스마트스토어' };
              const registered = !!store.platforms[key];
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: registered ? '#059669' : '#94a3b8', marginBottom: 4 }}>
                  <span>{registered ? '✓' : '○'}</span>
                  <span>{labels[key]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
