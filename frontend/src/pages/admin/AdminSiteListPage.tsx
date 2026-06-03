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
    to: '/admin/library/covers',
    icon: '📚',
    title: '라이브러리 표지',
    description: 'AI SEO Library 의 표지(카테고리) 및 챕터 배치 관리',
    color: 'var(--primary)',
  },
  {
    to: '/admin/library/posts',
    icon: '📖',
    title: '라이브러리 포스트',
    description: '라이브러리 챕터 본문(lead + bodyHtml) 작성 및 표지 배치',
    color: 'var(--accent-mid, #6366f1)',
  },
  {
    to: '/admin/library/audit',
    icon: '🪵',
    title: '라이브러리 감사 로그',
    description: '누가 언제 어떤 표지/포스트를 바꿨는지 시간 역순 추적',
    color: 'var(--accent-deep, #6b4fb8)',
  },
  {
    to: '/admin/course-inquiries',
    icon: '📞',
    title: '수강 문의',
    description: '코스 상담 요청 내역 확인',
    color: 'var(--warning)',
  },
  {
    to: '/admin/event-signups',
    icon: '🎟',
    title: '이벤트 신청',
    description: 'EVENT 01·02·03 신청 내역 확인',
    color: 'var(--accent-dark)',
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
  deactivated?: boolean;
  deactivatedAt?: string;
  movedTo?: string;
  domainChangeRequest?: {
    status?: string;
    reviewedAt?: string;
    previousSiteId?: string;
    requestedSiteId?: string;
  };
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

// Build "한명이 여러 개 가진" 표시를 위한 owner→count 매핑.
function ownerSiteCount(sites: SiteSummary[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of sites) {
    if (!s.ownerEmail) continue;
    counts[s.ownerEmail] = (counts[s.ownerEmail] || 0) + 1;
  }
  return counts;
}

const fmtDate = (iso?: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('ko-KR');
  } catch {
    return '-';
  }
};

const SITE_GRID = '1fr 1.4fr 80px 90px 110px 110px 100px';

export function AdminSiteListPage() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [busyId, setBusyId] = useState('');
  const navigate = useNavigate();

  const reload = () => {
    setLoading(true);
    adminGetSites()
      .then((data: { sites: SiteSummary[] }) => setSites(data.sites || []))
      .catch((e: Error) => setError(e.message || 'Failed to load sites'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  // Admin: deactivate any site (post-approval cleanup or duplicate-active cleanup).
  const handleDeactivate = async (site: SiteSummary) => {
    const msg = `"${site.siteId}.aiseo.tips" 를 비활성화하시겠습니까?\n` +
      `이후 이 주소로의 zip 업로드/배포가 차단됩니다.\n` +
      (site.movedTo ? `새 주소: ${site.movedTo}.aiseo.tips\n` : '') +
      `(S3 내용 자체는 그대로 남으며 별도 정리가 필요할 수 있습니다.)`;
    if (!confirm(msg)) return;
    setBusyId(site.siteId);
    setActionMsg('');
    try {
      await postJson('/domain-change/admin/deactivate', { siteId: site.siteId });
      setActionMsg(`${site.siteId} 비활성화 완료`);
      reload();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : '비활성화 실패');
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>불러오는 중...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>오류: {error}</div>;

  const counts = ownerSiteCount(sites);
  const activeCount = sites.filter((s) => !s.deactivated).length;
  const deactivatedCount = sites.length - activeCount;

  return (
    <div style={{ padding: 24, maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>관리자 대시보드</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          전체 {sites.length}개 사이트 (활성 {activeCount} / 비활성 {deactivatedCount}) · 관리 메뉴에서 세부 기능으로 이동할 수 있습니다.
        </p>
      </div>

      <AdminMenuGrid />

      <DomainChangeRequests />

      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        사이트 목록
      </h3>

      {actionMsg && (
        <div style={{
          padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 12,
          background: actionMsg.includes('실패') ? 'var(--danger-soft)' : 'var(--success-soft)',
          color: actionMsg.includes('실패') ? 'var(--danger-dark)' : 'var(--success-dark)',
        }}>
          {actionMsg}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: SITE_GRID, gap: 8, padding: '10px 16px', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
          <span>사이트 ID</span>
          <span>소유자</span>
          <span>상태</span>
          <span>완성도</span>
          <span>생성일</span>
          <span>비활성화일</span>
          <span>액션</span>
        </div>

        {/* Table Rows */}
        {sites.map((site) => {
          const ownerHasMultiple = (counts[site.ownerEmail] || 0) > 1;
          const isDeact = !!site.deactivated;
          const reviewedAt = site.domainChangeRequest?.reviewedAt;
          return (
            <div
              key={site.siteId}
              style={{
                display: 'grid', gridTemplateColumns: SITE_GRID, gap: 8, padding: '12px 16px',
                width: '100%', borderBottom: '1px solid var(--border-soft)',
                background: isDeact ? 'var(--bg-soft)' : '#fff',
                alignItems: 'center', minHeight: 56,
              }}
            >
              <button
                onClick={() => navigate(`/admin/site/${site.siteId}`)}
                style={{
                  fontSize: 13, fontWeight: 600,
                  color: isDeact ? 'var(--text-muted)' : 'var(--primary)',
                  textDecoration: isDeact ? 'line-through' : 'none',
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                {site.siteId}
                {site.movedTo && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>
                    → {site.movedTo}
                  </span>
                )}
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {site.ownerEmail || '-'}
                {ownerHasMultiple && (
                  <span title="이 소유자는 활성/비활성 포함 여러 사이트를 가지고 있습니다" style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                    background: 'var(--warning-soft)', color: 'var(--warning-dark)',
                  }}>×{counts[site.ownerEmail]}</span>
                )}
              </span>
              <span>
                {isDeact ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--border)', color: 'var(--text-secondary)' }}>비활성</span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--success-soft)', color: 'var(--success-dark)' }}>● 활성</span>
                )}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{site.brandCompleteness || 0}%</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(site.createdAt)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {isDeact ? (
                  <span title={reviewedAt ? `도메인 변경 승인: ${fmtDate(reviewedAt)}` : ''}>
                    {fmtDate(site.deactivatedAt || reviewedAt)}
                  </span>
                ) : '-'}
              </span>
              <span>
                {isDeact ? (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                ) : (
                  <button
                    onClick={() => handleDeactivate(site)}
                    disabled={busyId === site.siteId}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid var(--danger-soft)',
                      background: '#fff', color: 'var(--danger)', fontSize: 11, fontWeight: 600,
                      cursor: busyId === site.siteId ? 'wait' : 'pointer',
                      opacity: busyId === site.siteId ? 0.6 : 1,
                    }}
                  >
                    {busyId === site.siteId ? '처리 중...' : '비활성화'}
                  </button>
                )}
              </span>
            </div>
          );
        })}

        {sites.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>등록된 사이트가 없습니다.</div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        · 사이트 ID 의 <span style={{ textDecoration: 'line-through' }}>취소선</span> 은 비활성화된 행입니다. <strong>×N</strong> 배지는 같은 소유자가 보유한 사이트 수를 의미합니다.
        <br />· "비활성화" 버튼은 도메인 변경 승인 후 이전 주소를 정리하거나, 한 소유자에게 활성 사이트가 여러 개일 때 사용합니다. 이후 해당 siteId 로의 업로드/배포가 차단됩니다.
      </div>
    </div>
  );
}
