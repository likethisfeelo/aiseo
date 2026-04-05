import { PublicPageLayout } from './PublicPageLayout';

export function SupportPage() {
  return (
    <PublicPageLayout>
      <section className="persona" style={{ paddingTop: 80, paddingBottom: 100 }}>
        <div className="section-inner">
          <div className="persona-header">
            <div className="section-eyebrow">SUPPORT</div>
            <h2 className="section-h2">지원서비스</h2>
            <p className="section-sub" style={{ margin: '16px auto 0' }}>
              AISEO와 함께라면 혼자가 아닙니다. 시작부터 성장까지 함께합니다.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 56 }}>
            {[
              { icon: '🏗️', color: '#C4A8F5', bg: '#F0EBFF', title: 'AI 사이트 제작 가이드', desc: '업종별 AI 프롬프트 템플릿과 사이트 제작 가이드를 제공합니다. 비개발자도 1시간 안에 완성할 수 있습니다.' },
              { icon: '🌐', color: '#059669', bg: '#D1FAE5', title: '무료 호스팅 & 도메인', desc: '12개월 무료 서브도메인(yourname.aiseo.tips)과 1G 웹호스팅을 제공합니다. 별도 비용 없이 시작하세요.' },
              { icon: '🔍', color: '#F59E0B', bg: '#FEF3C7', title: 'SEO 자동 검증', desc: 'sitemap, robots.txt, 메타태그 등 5대 SEO 항목을 업로드 즉시 자동으로 검증하고 해결 가이드를 제공합니다.' },
              { icon: '📊', color: '#5B8DEF', bg: '#EBF2FF', title: '마케팅 코드 연동', desc: 'GA4, Google Ads, 서치콘솔, 네이버 웹마스터 코드를 ID만 입력하면 자동 삽입합니다.' },
              { icon: '🔒', color: '#8B6FD4', bg: '#F0EBFF', title: 'SSL & CDN', desc: 'AWS CloudFront 기반 글로벌 CDN 배포와 SSL 인증서 자동 적용. 보안과 속도를 동시에.' },
              { icon: '💬', color: '#EC4899', bg: '#FCE7F3', title: '1:1 컨설팅', desc: '업종별 전문 컨설턴트가 브랜드 방향 설정부터 SEO 전략까지 1:1로 안내합니다.' },
            ].map((item) => (
              <div key={item.title} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', padding: '36px 32px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-md)',
                  background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 20,
                }}>{item.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: -0.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="cta-inner" style={{ marginTop: 64 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', position: 'relative', zIndex: 1 }}>
              도움이 필요하신가요?
            </h3>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, position: 'relative', zIndex: 1 }}>
              궁금한 점이 있으시면 언제든 문의해 주세요.
            </p>
            <a href="/?auth=signup" className="btn-primary" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
              문의하기 →
            </a>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
