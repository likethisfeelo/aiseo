import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { UserProfile } from '../../types';

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
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Noto Sans KR', system-ui, sans-serif",
        background: '#f8fafc',
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
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
