import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { UserProfile } from '../../types';

// 대시보드/관리자 영역이 마운트되어 있는 동안 robots/googlebot
// noindex,nofollow meta 를 head 에 주입한다. robots.txt 의 Disallow
// 와 이중 방어 — robots.txt 를 무시하는 일부 크롤러나 외부 링크로
// 직접 도달한 케이스도 인덱싱되지 않게.
// (마운트가 풀리면 자동으로 제거되어 공개 라우트에는 영향 없음.)
function useDashboardNoIndex() {
  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex,nofollow';
    document.head.appendChild(robots);

    const googlebot = document.createElement('meta');
    googlebot.name = 'googlebot';
    googlebot.content = 'noindex,nofollow';
    document.head.appendChild(googlebot);

    return () => {
      robots.remove();
      googlebot.remove();
    };
  }, []);
}

interface Props {
  user: UserProfile;
  siteId: string;
  siteOnline: boolean;
  brandCompleteness: number;
  stageProgress: number;
  pageTitle: string;
  onLogout: () => void;
  onToggleEducation?: () => void;
  children: React.ReactNode;
}

export function DashboardLayout({
  user,
  siteId,
  siteOnline,
  brandCompleteness,
  stageProgress,
  pageTitle,
  onLogout,
  onToggleEducation,
  children,
}: Props) {
  useDashboardNoIndex();
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'var(--font-ko)',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
    >
      <Sidebar
        siteId={siteId}
        brandCompleteness={brandCompleteness}
        stageProgress={stageProgress}
        onToggleEducation={onToggleEducation}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          pageTitle={pageTitle}
          siteId={siteId}
          siteOnline={siteOnline}
          user={user}
          onLogout={onLogout}
          onToggleEducation={onToggleEducation}
        />
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
