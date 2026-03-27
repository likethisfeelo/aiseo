import type { UserProfile } from '../../types';

interface TopBarProps {
  pageTitle: string;
  siteId: string;
  siteOnline: boolean;
  user: UserProfile;
  onLogout: () => void;
  onToggleEducation?: () => void;
}

const STEPS = ['주소', '업로드', 'SEO', '연동', '배포'];

interface StepProps {
  currentStep: number;
}

function ProgressTracker({ currentStep }: StepProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEPS.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: done || active ? 600 : 400,
                background: active ? '#2563eb' : done ? '#dcfce7' : '#f1f5f9',
                color: active ? '#fff' : done ? '#166534' : '#94a3b8',
              }}
            >
              {done ? '✓' : i + 1}
              <span>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 16,
                  height: 1,
                  background: done ? '#86efac' : '#e2e8f0',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TopBar({ pageTitle, siteId, siteOnline, user, onLogout, onToggleEducation }: TopBarProps) {
  return (
    <header
      style={{
        height: 52,
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        fontFamily: "'Noto Sans KR', system-ui, sans-serif",
      }}
    >
      {/* Left: Page title + Site chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>{pageTitle}</h1>
        {siteId && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 14,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: 12,
              color: '#475569',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: siteOnline ? '#22c55e' : '#94a3b8',
              }}
            />
            {siteId}.aiseo.tips
          </div>
        )}
      </div>

      {/* Center: Progress tracker */}
      <ProgressTracker currentStep={2} />

      {/* Right: Education + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onToggleEducation && (
          <button
            onClick={onToggleEducation}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: '#fff',
              fontSize: 12,
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            📚 교육 자료
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#2563eb',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {(user.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{user.name || user.email}</div>
            <button
              onClick={onLogout}
              style={{
                fontSize: 11,
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
