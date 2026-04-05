import { PublicPageLayout } from './PublicPageLayout';

export function EventsPage() {
  return (
    <PublicPageLayout>
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="section-eyebrow">EVENTS</div>
        <h2 className="section-h2" style={{ marginBottom: 16 }}>이벤트</h2>
        <p className="section-sub" style={{ marginBottom: 60 }}>
          AISEO의 최신 이벤트와 프로모션을 확인하세요.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {[
            {
              tag: '진행중',
              tagColor: '#059669',
              tagBg: '#D1FAE5',
              title: '얼리버드 수강 할인',
              desc: '지금 수강 신청하시면 특별 얼리버드 할인 혜택을 드립니다. 12개월 호스팅 무료 포함.',
              date: '2026.04.01 ~ 선착순 마감',
            },
            {
              tag: '진행중',
              tagColor: '#059669',
              tagBg: '#D1FAE5',
              title: '친구 추천 이벤트',
              desc: '친구를 추천하면 추천인과 친구 모두 1개월 프리미엄 서비스를 무료로 제공합니다.',
              date: '2026.04.01 ~ 2026.06.30',
            },
            {
              tag: '예정',
              tagColor: '#D97706',
              tagBg: '#FEF3C7',
              title: 'AI SEO 무료 웨비나',
              desc: '소상공인을 위한 AI SEO 실전 가이드 무료 온라인 세미나를 개최합니다.',
              date: '2026년 5월 예정',
            },
          ].map((event) => (
            <div key={event.title} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '36px 32px',
              boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column',
            }}>
              <span style={{
                alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, padding: '4px 12px',
                borderRadius: 100, background: event.tagBg, color: event.tagColor, marginBottom: 20,
              }}>
                {event.tag}
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: -0.5 }}>
                {event.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
                {event.desc}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                {event.date}
              </p>
              <a href="/?auth=signup" className="btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
                자세히 보기 →
              </a>
            </div>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
