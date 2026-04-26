import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminGetSites } from '../../api';
import { getJson, postJson } from '../../api-client.js';

interface MenuCard {
  to: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const ADMIN_MENU: MenuCard[] = [
  {
    to: '/admin/blog/posts',
    icon: '📝',
    title: '블로그 글 관리',
    description: '발행·초안·삭제된 글 목록, 새 글 작성 및 편집',
    color: 'var(--primary)',
  },
  {
    to: '/admin/blog/categories',
    icon: '🗂',
    title: '블로그 카테고리',
    description: '블로그 분류 체계 생성 및 관리',
    color: 'var(--success)',
  },
  {
    to: '/admin/course-inquiries',
    icon: '📞',
    title: '수강 문의',
    description: '코스 상담 요청 내역 확인',
    color: 'var(--warning)',
  },
  {
    to: '/mktadmin',
    icon: '📊',
    title: '마케팅 어드민',
    description: '마케팅 지표 및 운영 도구',
    color: 'var(--accent-dark)',
  },
  {
    to: '/admin/quota-policy',
    icon: '📏',
    title: '쿼터 정책 관리',
    description: '사용자 업로드·저장 한도 및 교육 모드 설정',
    color: 'var(--info, #0ea5e9)',
  },
  {
    to: '/admin/users',
    icon: '👤',
    title: '회원 등급 관리',
    description: '유료 회원(paid_member) 승급·해제',
    color: 'var(--accent-mid, #6366f1)',
  },
];

function AdminMenuGrid() {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        관리 메뉴
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {ADMIN_MENU.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'block',
              padding: 16,
              borderRadius: 12,
              background: '#fff',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.08)';
              e.currentTarget.style.borderColor = item.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {item.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

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
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--warning-dark)', marginBottom: 12 }}>
        도메인 변경 요청 ({requests.length}건)
      </h3>
      {actionMsg && (
        <div style={{ padding: 10, borderRadius: 6, background: 'var(--success-soft)', border: '1px solid var(--success-soft)', fontSize: 12, color: 'var(--success-dark)', marginBottom: 12 }}>
          {actionMsg}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {requests.map((req) => (
          <div key={req.siteId || req.currentSiteId} style={{
            padding: 16, borderRadius: 10, background: 'var(--warning-soft)', border: '1px solid var(--warning-soft)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning-dark)' }}>
                  {req.currentSiteId}.aiseo.tips → <span style={{ color: 'var(--primary)' }}>{req.requestedSiteId}.aiseo.tips</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--warning-dark)', marginTop: 4 }}>{req.ownerEmail}</div>
                {req.reason && <div style={{ fontSize: 12, color: 'var(--warning-dark)', marginTop: 4 }}>사유: {req.reason}</div>}
                <div style={{ fontSize: 11, color: 'var(--warning-dark)', marginTop: 4 }}>
                  {new Date(req.createdAt).toLocaleDateString('ko-KR')} 요청
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleApprove(req.currentSiteId)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>승인</button>
              <button onClick={() => handleReject(req.currentSiteId)} style={{
                padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border-strong)', background: '#fff', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
              }}>거절</button>
              <button onClick={() => handleDeactivate(req.currentSiteId)} style={{
                padding: '6px 16px', borderRadius: 6, border: '1px solid var(--danger-soft)', background: '#fff', color: 'var(--danger)', fontSize: 12, cursor: 'pointer',
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>불러오는 중...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>오류: {error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>관리자 대시보드</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          전체 {sites.length}개 사이트 · 관리 메뉴에서 세부 기능으로 이동할 수 있습니다.
        </p>
      </div>

      <AdminMenuGrid />

      <DomainChangeRequests />

      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        사이트 목록
      </h3>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 120px', padding: '10px 16px', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
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
              width: '100%', border: 'none', borderBottom: '1px solid var(--border-soft)', background: '#fff',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-soft)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{site.siteId}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{site.ownerEmail}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{site.brandCompleteness || 0}%</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {site.updatedAt ? new Date(site.updatedAt).toLocaleDateString('ko') : '-'}
            </span>
          </button>
        ))}

        {sites.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>등록된 사이트가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
