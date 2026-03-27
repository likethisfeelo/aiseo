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

function ProgressTracker({ currentStep }: { currentStep: number }) {
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
              <div style={{ width: 16, height: 1, background: done ? '#86efac' : '#e2e8f0' }} />
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
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        flexShrink: 0,
        fontFamily: "'Noto Sans KR', system-ui, sans-serif",
        gap: 0,
      }}
    >
      {/* 1. Profile (로그인 정보) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16, borderRight: '1px solid #e2e8f0', marginRight: 16, flexShrink: 0 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#2563eb',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {(user.email || '?')[0].toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
            {user.name || user.email}
          </div>
          <button
            onClick={onLogout}
            style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 2. Deployed Site Status (좌측 정렬) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0, whiteSpace: 'nowrap' }}>{pageTitle}</h1>
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
              whiteSpace: 'nowrap',
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

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* 3. Progress Tracker (중앙 정렬) */}
      <ProgressTracker currentStep={2} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* 4. Education Button (우측 정렬, 크게) */}
      {onToggleEducation && (
        <button
          onClick={onToggleEducation}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            border: '1.5px solid #2563eb',
            background: '#eff6ff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
        >
          <span style={{ fontSize: 18 }}>📚</span>
          교육 자료
        </button>
      )}
    </header>
  );
}
