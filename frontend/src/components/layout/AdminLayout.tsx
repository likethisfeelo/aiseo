import { Link } from 'react-router-dom';
import type { UserProfile } from '../../types';

interface Props {
  user: UserProfile;
  onLogout: () => void;
  children: React.ReactNode;
}

/**
 * Minimal layout for /admin/* and /mktadmin routes.
 *
 * Intentionally does NOT render the user-facing Sidebar — admin pages are
 * path-only entry points (no sidebar nav entry), and the user wanted them
 * visually distinct from the regular dashboard. Navigation between admin
 * sub-pages is handled by the menu cards on the /admin landing page.
 */
export function AdminLayout({ user, onLogout, children }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: 'var(--font-ko)',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'var(--text-primary)',
          color: '#fff',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Link
          to="/admin"
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'DM Serif Display', serif",
            letterSpacing: '-0.01em',
          }}
        >
          <span>🔧</span>
          <span>AISEO 관리자</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/site/upload"
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.78)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,255,255,0.16)',
              fontFamily: 'var(--font-ko)',
            }}
          >
            ← 사용자 대시보드
          </Link>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-en)' }}>{user.email}</span>
          <button
            onClick={onLogout}
            style={{
              fontSize: 12,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.16)',
              color: 'rgba(255,255,255,0.78)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-ko)',
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  );
}
