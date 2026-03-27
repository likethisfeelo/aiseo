import type { EducationItem } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const AISEO_COURSES: EducationItem[] = [
  { id: 'seo-basics', title: 'SEO 기초 — 검색되는 사이트 만들기', duration: '23분', progress: 100, locked: false },
  { id: 'ga4-setup', title: 'GA4 설치부터 데이터 확인까지', duration: '31분', progress: 60, locked: false },
  { id: 'search-console', title: 'Search Console 15분 완전 정복', duration: '15분', progress: 0, locked: false },
  { id: 'google-ads', title: 'Google Ads 첫 캠페인 만들기', duration: '25분', progress: 0, locked: true, unlockRequirement: 'Search Console 교육 완료 후 해제' },
  { id: 'ga4-ads', title: 'GA4 데이터로 광고 최적화', duration: '28분', progress: 0, locked: true, unlockRequirement: 'Google Ads 교육 완료 후 해제' },
];

const SELF_STUDY = [
  { title: 'Google Search Console 공식 도움말', url: '#' },
  { title: 'GA4 종합 가이드 (YouTube)', url: '#' },
  { title: 'Naver 키워드 도구', url: '#' },
  { title: 'Moz SMB SEO 가이드', url: '#' },
  { title: 'Google Ads 공식 가이드', url: '#' },
];

export function EducationDrawer({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.2)',
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 360,
          height: '100vh',
          background: '#fff',
          borderLeft: '1px solid #e2e8f0',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
          fontFamily: "'Noto Sans KR', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1e293b' }}>📚 교육 자료</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* AISEO Provided */}
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>AISEO 제공 교육</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {AISEO_COURSES.map((course) => (
              <div
                key={course.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: course.locked ? '#f8fafc' : '#fff',
                  opacity: course.locked ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{course.title}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{course.duration}</span>
                </div>
                {!course.locked && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${course.progress}%`, background: course.progress === 100 ? '#22c55e' : '#2563eb', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: course.progress === 100 ? '#16a34a' : '#64748b' }}>
                      {course.progress === 100 ? '완료' : course.progress > 0 ? `${course.progress}%` : '미시청'}
                    </span>
                  </div>
                )}
                {course.locked && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    🔒 {course.unlockRequirement}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Self Study */}
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>자체 학습 자료</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SELF_STUDY.map((item) => (
              <a
                key={item.title}
                href={item.url}
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#f8fafc',
                  color: '#2563eb',
                  fontSize: 12,
                  textDecoration: 'none',
                }}
              >
                {item.title} →
              </a>
            ))}
          </div>

          {/* AI CTA */}
          <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: 'linear-gradient(135deg, #eff6ff, #f3e8ff)', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>AI에게 물어보기</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Claude 또는 ChatGPT에 직접 질문하세요</div>
          </div>
        </div>
      </div>
    </>
  );
}
