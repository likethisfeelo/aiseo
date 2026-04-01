import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProgressRing } from '../common/ProgressRing';

interface SidebarProps {
  siteId: string;
  brandCompleteness: number;
  stageProgress: number;
  onToggleEducation?: () => void;
}

interface ChildItem {
  path: string;
  label: string;
  section?: string;  // section header before this item
  locked?: boolean;
}

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  children: ChildItem[];
}

const MENU: MenuItem[] = [
  {
    id: 'site',
    icon: '🌐',
    label: '사이트 관리',
    children: [
      { path: '/site/upload', label: '사이트 업로드' },
      { path: '/site/seo', label: 'SEO 검증' },
      { path: '/site/deployed', label: '배포된 사이트' },
    ],
  },
  {
    id: 'marketing',
    icon: '📊',
    label: '마케팅 관리',
    children: [
      { path: '/brand', label: '브랜드 관리', section: '브랜드' },
      { path: '/products', label: '상품 관리' },
      { path: '/services', label: '서비스 관리' },
      { path: '/store', label: '매장 관리' },
      { path: '/seo-status', label: 'SEO 현황', section: '검색 & 분석' },
      { path: '/analytics', label: '마케팅 분석' },
      { path: '/ads', label: '광고 관리', section: '광고 & 콘텐츠', locked: true },
      { path: '/content', label: '콘텐츠 자동화', locked: true },
      { path: '/roadmap', label: '성장 로드맵', section: '성장' },
    ],
  },
];

function getExpandedFromPath(pathname: string): string {
  if (pathname.startsWith('/site')) return 'site';
  if (['/brand', '/products', '/services', '/store', '/roadmap', '/seo-status', '/analytics', '/ads', '/content'].some((p) => pathname.startsWith(p))) return 'marketing';
  return 'site';
}

export function Sidebar({ siteId, brandCompleteness, stageProgress, onToggleEducation }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(() => getExpandedFromPath(location.pathname));

  useEffect(() => {
    setExpandedId(getExpandedFromPath(location.pathname));
  }, [location.pathname]);

  const expandedIdx = MENU.findIndex((m) => m.id === expandedId);

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
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: 4 }}>
            BETA
          </span>
        </div>
        {siteId && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {siteId}.aiseo.tips
          </div>
        )}
      </div>

      {/* Main nav area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Collapsed menus BEFORE expanded */}
        {MENU.slice(0, expandedIdx).map((menu) => (
          <SectionHeader
            key={menu.id}
            menu={menu}
            expanded={false}
            onClick={() => {
              setExpandedId(menu.id);
              navigate(menu.children[0].path);
            }}
          />
        ))}

        {/* Expanded menu + children */}
        {expandedIdx >= 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionHeader
              menu={MENU[expandedIdx]}
              expanded={true}
              onClick={() => {}}
            />
            <div style={{ background: '#fafbfc', overflowY: 'auto', flex: 1 }}>
              {MENU[expandedIdx].children.map((child) => {
                const active = location.pathname === child.path;
                const disabled = child.locked;
                return (
                  <div key={child.path}>
                    {child.section && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', padding: '10px 16px 3px 40px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {child.section}
                      </div>
                    )}
                    <button
                      onClick={() => !disabled && navigate(child.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 16px 8px 40px',
                        border: 'none',
                        background: active ? '#eff6ff' : 'transparent',
                        color: disabled ? '#b0b8c4' : active ? '#2563eb' : '#475569',
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        cursor: disabled ? 'default' : 'pointer',
                        borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
                        transition: 'background 0.15s, color 0.15s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={(e) => { if (!active && !disabled) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{child.label}</span>
                      {disabled && <span style={{ fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>준비 중</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Collapsed menus AFTER expanded */}
        {MENU.slice(expandedIdx + 1).map((menu) => (
          <SectionHeader
            key={menu.id}
            menu={menu}
            expanded={false}
            onClick={() => {
              setExpandedId(menu.id);
              navigate(menu.children[0].path);
            }}
          />
        ))}

        {/* Education - always at bottom */}
        <button
          onClick={onToggleEducation}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            borderTop: '1px solid #f1f5f9',
            background: 'transparent',
            color: '#475569',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ fontSize: 16 }}>📚</span>
          <span>교육 안내</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>›</span>
        </button>
      </div>

      {/* Bottom: Completeness */}
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

/* ── Section Header (1단계 메뉴) ── */
function SectionHeader({ menu, expanded, onClick }: { menu: MenuItem; expanded: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        background: expanded ? '#f1f5f9' : 'transparent',
        color: expanded ? '#1e293b' : '#475569',
        fontSize: 14,
        fontWeight: 600,
        cursor: expanded ? 'default' : 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        borderBottom: expanded ? '1px solid #e2e8f0' : 'none',
        transition: 'background 0.2s, color 0.2s',
      }}
      onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 16 }}>{menu.icon}</span>
      <span>{menu.label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none' }}>
        ›
      </span>
    </button>
  );
}
