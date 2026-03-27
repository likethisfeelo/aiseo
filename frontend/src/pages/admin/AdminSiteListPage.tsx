import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetSites } from '../../api';

interface SiteSummary {
  siteId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  brandCompleteness: number;
}

export function AdminSiteListPage() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    adminGetSites()
      .then((data: { sites: SiteSummary[] }) => setSites(data.sites || []))
      .catch((e: Error) => setError(e.message || 'Failed to load sites'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>불러오는 중...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>오류: {error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>🔧 관리자 — 사이트 목록</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>전체 {sites.length}개 사이트</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 120px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
          <span>사이트 ID</span>
          <span>소유자</span>
          <span>완성도</span>
          <span>최종 수정</span>
        </div>

        {/* Table Rows */}
        {sites.map((site) => (
          <button
            key={site.siteId}
            onClick={() => navigate(`/admin/site/${site.siteId}`)}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 120px', padding: '12px 16px',
              width: '100%', border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{site.siteId}</span>
            <span style={{ fontSize: 12, color: '#475569' }}>{site.ownerEmail}</span>
            <span style={{ fontSize: 12, color: '#475569' }}>{site.brandCompleteness || 0}%</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {site.updatedAt ? new Date(site.updatedAt).toLocaleDateString('ko') : '-'}
            </span>
          </button>
        ))}

        {sites.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>등록된 사이트가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
