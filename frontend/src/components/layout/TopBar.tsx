import type { UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';

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
                background: active ? 'var(--primary)' : done ? 'var(--success-soft)' : 'var(--border-soft)',
                color: active ? 'var(--primary-contrast)' : done ? 'var(--success)' : 'var(--text-muted)',
              }}
            >
              {done ? '✓' : i + 1}
              <span>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 16, height: 1, background: done ? 'var(--success)' : 'var(--border)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TopBar({ pageTitle, siteId, siteOnline, user, onLogout, onToggleEducation }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header
      style={{
        height: 56,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        flexShrink: 0,
        fontFamily: 'var(--font-ko)',
        gap: 0,
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* 1. Profile (로그인 정보) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 12, borderRight: '1px solid var(--border)', marginRight: 12, flexShrink: 0 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'var(--primary-contrast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {(user.email || '?')[0].toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
            {user.name || user.email}
          </div>
          <button
            onClick={onLogout}
            style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 2. Deployed Site Status (좌측 정렬) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
        <h1 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageTitle}</h1>
        {siteId && (
          <div
            onClick={() => navigate('/domain')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 14,
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s',
              fontFamily: 'var(--font-en)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-soft)'; e.currentTarget.style.borderColor = 'var(--accent-mid)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-soft)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: siteOnline ? 'var(--success)' : 'var(--text-muted)',
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

      {/* 4. Version tag */}
      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 12, flexShrink: 0, fontFamily: 'var(--font-en)' }}>v.0402-1</span>

      {/* 5. Education Button (우측 정렬, 크게) */}
      {onToggleEducation && (
        <button
          onClick={onToggleEducation}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--primary)',
            background: 'var(--primary-soft)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-soft-strong)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-soft)'; }}
        >
          <span style={{ fontSize: 18 }}>📚</span>
          교육 자료
        </button>
      )}
    </header>
  );
}
