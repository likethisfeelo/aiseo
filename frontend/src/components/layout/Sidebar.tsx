import { useLocation, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { ProgressRing } from '../common/ProgressRing';
import type { BadgeStatus } from '../../types';

interface SidebarProps {
  siteId: string;
  brandCompleteness: number;
  stageProgress: number;
}

interface NavItemDef {
  path: string;
  label: string;
  badge?: BadgeStatus;
  badgeText?: string;
  count?: number;
}

interface NavSectionDef {
  title: string;
  items: NavItemDef[];
}

const NAV_SECTIONS: NavSectionDef[] = [
  {
    title: '내 브랜드',
    items: [
      { path: '/brand', label: '브랜드 관리', badge: 'in-progress', badgeText: '입력중' },
      { path: '/products', label: '상품 관리', badge: 'empty', count: 0 },
      { path: '/services', label: '서비스 관리', badge: 'empty', count: 0 },
      { path: '/store', label: '매장 관리', badge: 'empty', badgeText: '미입력' },
    ],
  },
  {
    title: '내 사이트',
    items: [
      { path: '/site', label: '사이트 관리' },
      { path: '/roadmap', label: '성장 로드맵' },
    ],
  },
  {
    title: '검색 최적화',
    items: [
      { path: '#', label: 'SEO 현황', badge: 'coming-soon', badgeText: '미연결' },
      { path: '#', label: '마케팅 분석', badge: 'coming-soon', badgeText: 'GA4' },
    ],
  },
  {
    title: '광고 & 콘텐츠',
    items: [
      { path: '#', label: '광고 관리', badge: 'needs-education', badgeText: '교육 필요' },
      { path: '#', label: '콘텐츠 자동화', badge: 'coming-soon', badgeText: '출시 예정' },
    ],
  },
  {
    title: '교육 & 지원',
    items: [
      { path: '#', label: '교육 & 컨설팅' },
    ],
  },
];

export function Sidebar({ siteId, brandCompleteness, stageProgress }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      style={{
        width: 220,
        minHeight: '100vh',
        background: '#fff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        fontFamily: "'Noto Sans KR', system-ui, sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', fontFamily: "'DM Serif Display', serif" }}>
            AISEO
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#2563eb',
              background: '#eff6ff',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            BETA
          </span>
        </div>
        {siteId && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {siteId}.aiseo.tips
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#94a3b8',
                padding: '8px 16px 4px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = location.pathname === item.path;
              const disabled = item.path === '#';
              return (
                <button
                  key={item.path + item.label}
                  onClick={() => !disabled && navigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: active ? '#eff6ff' : 'transparent',
                    color: disabled ? '#94a3b8' : active ? '#2563eb' : '#334155',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: disabled ? 'default' : 'pointer',
                    textAlign: 'left',
                    borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !active) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{item.label}</span>
                  {item.badge && <StatusBadge status={item.badge} text={item.badgeText} />}
                  {typeof item.count === 'number' && !item.badge && (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom: Brand Completeness */}
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <ProgressRing value={brandCompleteness} size={52} strokeWidth={4} label="브랜드 완성도" />
        <div style={{ width: '100%', background: '#f1f5f9', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${stageProgress}%`,
              background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          전체 여정 {stageProgress}%
        </span>
      </div>
    </nav>
  );
}
