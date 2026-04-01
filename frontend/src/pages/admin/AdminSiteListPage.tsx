import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetSites } from '../../api';
import { getJson, postJson } from '../../api-client.js';

interface SiteSummary {
  siteId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  brandCompleteness: number;
}

interface DomainRequest {
  siteId: string;
  ownerEmail: string;
  currentSiteId: string;
  requestedSiteId: string;
  reason: string;
  status: string;
  createdAt: string;
}

function DomainChangeRequests() {
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadRequests = () => {
    getJson('/domain-change/admin')
      .then((data: { requests: DomainRequest[] }) => setRequests(data.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

  const handleApprove = async (siteId: string) => {
    if (!confirm('이 도메인 변경 요청을 승인하시겠습니까? 기존 주소의 데이터가 새 주소로 이전됩니다.')) return;
    try {
      const data = await postJson('/domain-change/admin/approve', { siteId });
      setActionMsg(data.message || '승인 완료');
      loadRequests();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '승인 실패');
    }
  };

  const handleReject = async (siteId: string) => {
    const note = prompt('거절 사유 (선택):');
    try {
      await postJson('/domain-change/admin/reject', { siteId, reviewNote: note || '' });
      setActionMsg('거절 완료');
      loadRequests();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '거절 실패');
    }
  };

  const handleDeactivate = async (siteId: string) => {
    if (!confirm(`"${siteId}" 서브도메인을 비활성화하시겠습니까?`)) return;
    try {
      await postJson('/domain-change/admin/deactivate', { siteId });
      setActionMsg(`${siteId} 비활성화 완료`);
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '비활성화 실패');
    }
  };

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>
        도메인 변경 요청 ({requests.length}건)
      </h3>
      {actionMsg && (
        <div style={{ padding: 10, borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, color: '#166534', marginBottom: 12 }}>
          {actionMsg}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {requests.map((req) => (
          <div key={req.siteId || req.currentSiteId} style={{
            padding: 16, borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>
                  {req.currentSiteId}.aiseo.tips → <span style={{ color: '#2563eb' }}>{req.requestedSiteId}.aiseo.tips</span>
                </div>
                <div style={{ fontSize: 12, color: '#78350f', marginTop: 4 }}>{req.ownerEmail}</div>
                {req.reason && <div style={{ fontSize: 12, color: '#a16207', marginTop: 4 }}>사유: {req.reason}</div>}
                <div style={{ fontSize: 11, color: '#a16207', marginTop: 4 }}>
                  {new Date(req.createdAt).toLocaleDateString('ko-KR')} 요청
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleApprove(req.currentSiteId)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>승인</button>
              <button onClick={() => handleReject(req.currentSiteId)} style={{
                padding: '6px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#475569', fontSize: 12, cursor: 'pointer',
              }}>거절</button>
              <button onClick={() => handleDeactivate(req.currentSiteId)} style={{
                padding: '6px 16px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 12, cursor: 'pointer',
              }}>기존 주소 비활성화</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

      <DomainChangeRequests />

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
