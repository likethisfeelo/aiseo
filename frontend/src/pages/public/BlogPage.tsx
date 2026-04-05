import { PublicPageLayout } from './PublicPageLayout';

export function BlogPage() {
  return (
    <PublicPageLayout>
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="section-eyebrow">BLOG</div>
        <h2 className="section-h2" style={{ marginBottom: 16 }}>블로그</h2>
        <p className="section-sub" style={{ marginBottom: 60 }}>
          AI SEO 인사이트, 실전 가이드, 성공 사례를 공유합니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[
            {
              thumb: 'blog-thumb-1',
              tag: 'PLAYBOOK',
              headline: 'THE AI SEO\nPLAYBOOK\n2026',
              title: 'AI로 완성하는 2026 SEO 전략 플레이북: 웹사이트 제작부터 상위 노출까지',
              date: '2026.04.01',
            },
            {
              thumb: 'blog-thumb-3',
              tag: 'TECHNICAL',
              headline: '기술적 SEO란\n무엇인가?',
              title: '기술적 SEO 완전 정복: AI가 자동화하는 핵심 요소와 체크리스트',
              date: '2026.03.25',
            },
            {
              thumb: 'blog-thumb-4',
              tag: 'PRICING',
              headline: '',
              title: 'SEO 에이전시 vs AI 자동화: 2026년 비용 완전 비교 가이드',
              date: '2026.03.18',
            },
            {
              thumb: 'blog-thumb-1',
              tag: 'GUIDE',
              headline: 'AI로 만드는\n홈페이지',
              title: 'ChatGPT로 홈페이지 만들기: 소상공인을 위한 완전 가이드',
              date: '2026.03.10',
            },
            {
              thumb: 'blog-thumb-3',
              tag: 'SEO',
              headline: '네이버 vs\n구글 SEO',
              title: '네이버와 구글, 검색엔진별 SEO 전략의 차이점과 동시 최적화 방법',
              date: '2026.03.03',
            },
            {
              thumb: 'blog-thumb-4',
              tag: 'CASE STUDY',
              headline: '',
              title: '홍대 라멘집이 네이버 3위에 오르기까지: AISEO 도입 성공 사례',
              date: '2026.02.25',
            },
          ].map((post, i) => (
            <a href="#" key={i} className="blog-card" style={{ textDecoration: 'none' }}>
              <div className="blog-thumb">
                <div className={`blog-thumb-inner ${post.thumb}`} style={post.headline ? { justifyContent: 'center', alignItems: 'center' } : undefined}>
                  <div className="blog-thumb-tag" style={post.thumb === 'blog-thumb-4' ? { background: 'rgba(0,0,0,0.1)', color: '#1C1917' } : undefined}>
                    {post.tag}
                  </div>
                  {post.headline && (
                    <div className="blog-thumb-headline" style={{ textAlign: 'center' }}
                      dangerouslySetInnerHTML={{ __html: post.headline.replace(/\n/g, '<br/>') }} />
                  )}
                  {!post.headline && post.thumb === 'blog-thumb-4' && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: '90%' }}>
                      <div style={{ fontFamily: 'var(--font-ko)', fontSize: 20, fontWeight: 800, color: '#1C1917', lineHeight: 1.2 }}>
                        SEO 비용은<br/>얼마일까?
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="blog-card-title">{post.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{post.date}</p>
            </a>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
