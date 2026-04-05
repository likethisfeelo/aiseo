import { PublicPageLayout } from './PublicPageLayout';

export function SupportPage() {
  return (
    <PublicPageLayout>
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="section-eyebrow">SUPPORT</div>
        <h2 className="section-h2" style={{ marginBottom: 16 }}>지원서비스</h2>
        <p className="section-sub" style={{ marginBottom: 60 }}>
          AISEO와 함께라면 혼자가 아닙니다. 시작부터 성장까지 함께합니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { icon: '🏗️', title: 'AI 사이트 제작 가이드', desc: '업종별 AI 프롬프트 템플릿과 사이트 제작 가이드를 제공합니다. 비개발자도 1시간 안에 완성할 수 있습니다.' },
            { icon: '🌐', title: '무료 호스팅 & 도메인', desc: '12개월 무료 서브도메인(yourname.aiseo.tips)과 1G 웹호스팅을 제공합니다. 별도 비용 없이 시작하세요.' },
            { icon: '🔍', title: 'SEO 자동 검증', desc: 'sitemap, robots.txt, 메타태그 등 5대 SEO 항목을 업로드 즉시 자동으로 검증하고 해결 가이드를 제공합니다.' },
            { icon: '📊', title: '마케팅 코드 연동', desc: 'GA4, Google Ads, 서치콘솔, 네이버 웹마스터 코드를 ID만 입력하면 자동 삽입합니다.' },
            { icon: '🔒', title: 'SSL & CDN', desc: 'AWS CloudFront 기반 글로벌 CDN 배포와 SSL 인증서 자동 적용. 보안과 속도를 동시에.' },
            { icon: '💬', title: '1:1 컨설팅', desc: '업종별 전문 컨설턴트가 브랜드 방향 설정부터 SEO 전략까지 1:1로 안내합니다.' },
          ].map((item) => (
            <div key={item.title} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '32px 28px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: -0.3 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 64, textAlign: 'center', padding: '48px 40px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
            도움이 필요하신가요?
          </h3>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
            궁금한 점이 있으시면 언제든 문의해 주세요.
          </p>
          <a href="/?auth=signup" className="btn-primary" style={{ textDecoration: 'none' }}>
            문의하기 →
          </a>
        </div>
      </section>
    </PublicPageLayout>
  );
}
