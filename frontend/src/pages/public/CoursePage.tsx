import { PublicPageLayout } from './PublicPageLayout';

export function CoursePage() {
  return (
    <PublicPageLayout>
      <section className="persona" style={{ paddingTop: 80, paddingBottom: 100 }}>
        <div className="section-inner">
          <div className="persona-header">
            <div className="section-eyebrow">COURSE</div>
            <h2 className="section-h2">수강안내</h2>
            <p className="section-sub" style={{ margin: '16px auto 0' }}>
              AI 시대에 맞는 온라인 마케팅, 1시간이면 시작할 수 있습니다.
            </p>
          </div>

          {/* Course Cards — reuse sf-card style patterns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 56 }}>
            {[
              {
                icon: '🎓', color: '#C4A8F5', bg: '#F0EBFF',
                title: 'AI 홈페이지 제작 과정',
                desc: 'ChatGPT · Claude를 활용한 웹사이트 제작 프롬프트부터 실제 배포까지 한 번에 배웁니다.',
                duration: '1시간', level: '입문',
              },
              {
                icon: '🔍', color: '#F59E0B', bg: '#FEF3C7',
                title: 'SEO 핵심 마스터',
                desc: 'sitemap, robots.txt, 메타태그 등 검색엔진 최적화의 핵심을 실전 중심으로 배웁니다.',
                duration: '1시간', level: '초급',
              },
              {
                icon: '📈', color: '#9BB8F8', bg: '#EBF2FF',
                title: '마케팅 자동화 과정',
                desc: 'GA4, 서치콘솔, 네이버 웹마스터 연동부터 AI 콘텐츠 자동화까지 실무 중심 교육.',
                duration: '1시간 30분', level: '중급',
              },
            ].map((course) => (
              <div key={course.title} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', padding: '36px 32px',
                boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-md)',
                  background: course.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, marginBottom: 24,
                }}>{course.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: -0.5 }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24, flex: 1 }}>
                  {course.desc}
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, background: course.bg, color: course.color }}>
                    {course.duration}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, background: '#D1FAE5', color: '#059669' }}>
                    {course.level}
                  </span>
                </div>
                <a href="/?auth=signup" className="btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
                  수강신청하기 →
                </a>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="cta-inner" style={{ marginTop: 64 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', position: 'relative', zIndex: 1 }}>
              수강료 안내
            </h3>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24, position: 'relative', zIndex: 1 }}>
              사업자 대상 · 12개월 호스팅 포함 · 업종별 1:1 컨설팅 포함
            </p>
            <a href="/?auth=signup" className="btn-primary" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
              상담 신청하기 →
            </a>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
