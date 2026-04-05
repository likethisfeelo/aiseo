import { PublicPageLayout } from './PublicPageLayout';

export function BlogPage() {
  return (
    <PublicPageLayout>
      <section className="blog-section" style={{ paddingTop: 80, paddingBottom: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="section-eyebrow" style={{ textAlign: 'center' }}>BLOG</div>
            <h2 className="section-h2" style={{ textAlign: 'center' }}>블로그</h2>
            <p className="section-sub" style={{ margin: '16px auto 0', textAlign: 'center' }}>
              AI SEO 인사이트, 실전 가이드, 성공 사례를 공유합니다.
            </p>
          </div>
        </div>

        <div className="blog-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {[
            { thumb: 'blog-thumb-1', tag: 'PLAYBOOK', headline: 'THE AI SEO<br/>PLAYBOOK<br/>2026', title: 'AI로 완성하는 2026 SEO 전략 플레이북: 웹사이트 제작부터 상위 노출까지', date: '2026.04.01' },
            { thumb: 'blog-thumb-2', tag: 'GUIDE', headline: '', title: 'ChatGPT와 AISEO를 활용한 키워드 리서치 자동화 5가지 방법 (2026)', date: '2026.03.28', isUI: true },
            { thumb: 'blog-thumb-3', tag: 'TECHNICAL', headline: '기술적 SEO란<br/>무엇인가?', title: '기술적 SEO 완전 정복: AI가 자동화하는 핵심 요소와 체크리스트', date: '2026.03.25' },
            { thumb: 'blog-thumb-4', tag: 'PRICING', headline: '', title: 'SEO 에이전시 vs AI 자동화: 2026년 비용 완전 비교 가이드', date: '2026.03.18', isPricing: true },
            { thumb: 'blog-thumb-1', tag: 'GUIDE', headline: 'AI로 만드는<br/>홈페이지', title: 'ChatGPT로 홈페이지 만들기: 소상공인을 위한 완전 가이드', date: '2026.03.10' },
            { thumb: 'blog-thumb-3', tag: 'SEO', headline: '네이버 vs<br/>구글 SEO', title: '네이버와 구글, 검색엔진별 SEO 전략의 차이점과 동시 최적화 방법', date: '2026.03.03' },
            { thumb: 'blog-thumb-4', tag: 'CASE STUDY', headline: '', title: '홍대 라멘집이 네이버 3위에 오르기까지: AISEO 도입 성공 사례', date: '2026.02.25', isPricing: true },
            { thumb: 'blog-thumb-1', tag: 'INSIGHT', headline: 'AEO란<br/>무엇인가?', title: 'AEO(AI Engine Optimization): AI 검색 시대의 새로운 최적화 전략', date: '2026.02.18' },
          ].map((post, i) => (
            <a href="#" key={i} className="blog-card" style={{ textDecoration: 'none' }}>
              <div className="blog-thumb">
                <div className={`blog-thumb-inner ${post.thumb}`}
                  style={post.isUI ? { justifyContent: 'flex-start', padding: 14 } : post.headline ? { justifyContent: 'center', alignItems: 'center' } : undefined}>
                  <div className="blog-thumb-tag"
                    style={post.thumb === 'blog-thumb-4' ? { background: 'rgba(0,0,0,0.1)', color: '#1C1917' } : undefined}>
                    {post.tag}
                  </div>
                  {post.headline && (
                    <div className="blog-thumb-headline" style={{ textAlign: 'center' }}
                      dangerouslySetInnerHTML={{ __html: post.headline }} />
                  )}
                  {post.isUI && (
                    <div style={{ marginTop: 24, width: '100%' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                        ChatGPT로 키워드 리서치하는<br/>5가지 프롬프트
                      </div>
                      <div className="blog-mock-rows">
                        <div className="blog-mock-row" style={{ width: '100%' }}></div>
                        <div className="blog-mock-row accent"></div>
                        <div className="blog-mock-row" style={{ width: '80%' }}></div>
                        <div className="blog-mock-row" style={{ width: '50%', background: 'var(--accent)', opacity: 0.3 }}></div>
                      </div>
                    </div>
                  )}
                  {post.isPricing && !post.headline && (
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
