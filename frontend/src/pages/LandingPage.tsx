import './landing.css';

interface Props {
  authError: string;
}

export function LandingPage({ authError }: Props) {
  return (
    <>
      {/* NAV */}
      <nav className="lp-nav">
        <div className="nav-logo">AI<span>SEO</span></div>
        <div className="nav-links">
          <a href="#flow">이용 방법</a>
          <a href="#packages">서비스 구성</a>
          <a href="#trust">자주 묻는 질문</a>
          <a href="/?auth=login" className="btn-nav">무료로 시작하기 →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="hero">
          <div>
            <div className="hero-badge">소상공인 맞춤 · AI SEO 플랫폼</div>
            <h1>내 사업, <em>검색되는</em><br />홈페이지로<br />5분 만에 완성</h1>
            <p className="hero-sub">
              AI로 만든 웹사이트를 SEO 최적화 검증 후<br />
              <strong>원클릭으로 배포</strong>하는 올인원 플랫폼.<br />
              가방 공방, 웨딩스냅, 공예 클래스… 내 업종에 맞게.
            </p>
            {authError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626' }}>
                {authError}
              </div>
            )}
            <div className="hero-cta">
              <a href="/?auth=signup" className="btn-primary">무료로 시작하기 →</a>
              <a href="#packages" className="btn-ghost">서비스 구성 보기</a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-num">5분</span>
                <span className="stat-label">평균 배포 소요 시간</span>
              </div>
              <div className="stat">
                <span className="stat-num">5가지</span>
                <span className="stat-label">SEO 자동 검증 항목</span>
              </div>
              <div className="stat">
                <span className="stat-num">0원</span>
                <span className="stat-label">호스팅 별도 비용</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="float-chip c1">🚀 배포 완료!</div>
            <div className="float-chip c2">🔍 Google 검색 등록</div>
            <div className="float-chip c3">📊 GA4 연동됨</div>
            <div className="site-preview">
              <div className="preview-bar">
                <div className="dot r"></div>
                <div className="dot y"></div>
                <div className="dot g"></div>
                <div className="preview-url">🔒 my-studio.aiseo.tips</div>
              </div>
              <div className="preview-content">
                <div className="seo-check">
                  <div className="check-item pass"><span className="check-icon">✅</span>index.html 존재 여부</div>
                  <div className="check-item pass"><span className="check-icon">✅</span>&lt;title&gt; 태그 확인</div>
                  <div className="check-item pass"><span className="check-icon">✅</span>meta description 존재</div>
                  <div className="check-item fail"><span className="check-icon">⚠️</span>robots.txt — 추가 권장</div>
                  <div className="check-item pass"><span className="check-icon">✅</span>sitemap.xml 존재</div>
                </div>
                <div className="deploy-badge">
                  <div>
                    <div>배포 완료 — 4/5 통과</div>
                    <div className="deploy-url">https://my-studio.aiseo.tips</div>
                  </div>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IS THIS FOR */}
      <section className="who">
        <div className="section-inner">
          <div className="section-tag">대상 고객</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 className="section-title">이런 분들께 딱 맞습니다</h2>
              <p className="section-sub">개발자 없이 직접 영업·홍보·제작을 다 하시는<br />1인 기업 대표님을 위한 서비스입니다.</p>
            </div>
          </div>
          <div className="who-grid">
            <div className="who-card">
              <span className="who-emoji">👜</span>
              <h3>가방 공방 / 공예 클래스</h3>
              <p>"인스타는 있는데 홈페이지가 없어요. 구글에서 검색하면 안 나와요."</p>
              <span className="who-tag">검색 노출 0 → 시작</span>
            </div>
            <div className="who-card">
              <span className="who-emoji">📸</span>
              <h3>웨딩스냅 / 작가 스튜디오</h3>
              <p>"포트폴리오 사이트는 만들었는데, 문의가 잘 안 와요."</p>
              <span className="who-tag">SEO 최적화 필요</span>
            </div>
            <div className="who-card">
              <span className="who-emoji">🌿</span>
              <h3>플리마켓 / 소규모 브랜드</h3>
              <p>"AI로 홈페이지 뚝딱 만들었는데, 어떻게 올리는지 모르겠어요."</p>
              <span className="who-tag">배포 + 마케팅 연동</span>
            </div>
          </div>
        </div>
      </section>

      {/* FLOW */}
      <section className="flow" id="flow">
        <div className="section-inner">
          <div className="section-tag">이용 방법</div>
          <h2 className="section-title">딱 5단계, 어렵지 않아요</h2>
          <p className="section-sub">개발 지식 없이도 따라할 수 있습니다.<br />평균 소요 시간: 5~15분</p>
          <div className="flow-steps">
            {[
              { num: '01', icon: '👤', title: '회원가입 &\n로그인', desc: '이메일로 30초 만에 가입' },
              { num: '02', icon: '🔗', title: '내 사이트\n주소 선택', desc: 'my-shop.aiseo.tips 형태로 원하는 주소 확정' },
              { num: '03', icon: '📤', title: 'AI 사이트\nZIP 업로드', desc: 'ChatGPT·Claude로 만든 사이트를 ZIP으로 압축 후 업로드' },
              { num: '04', icon: '🔍', title: 'SEO 자동\n검증', desc: '5개 핵심 항목 자동 체크 + 실패 시 해결 가이드 제공' },
              { num: '05', icon: '🚀', title: '원클릭\n배포 완료!', desc: 'GA4·서치콘솔 자동 연동 후 즉시 접속 가능' },
            ].map((s, i) => (
              <div className="flow-step" key={s.num}>
                <div className="flow-num">{s.num}</div>
                <span className="flow-icon">{s.icon}</span>
                <h3 dangerouslySetInnerHTML={{ __html: s.title.replace('\n', '<br/>') }} />
                <p>{s.desc}</p>
                {i < 4 && <div className="flow-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="packages" id="packages">
        <div className="section-inner">
          <div className="pkg-header">
            <div>
              <div className="section-tag">서비스 구성</div>
              <h2 className="section-title">지금 어느 단계에 계세요?</h2>
              <p className="section-sub">브랜드 준비 상태에 따라 시작점이 달라집니다.<br />어디서든 시작할 수 있어요.</p>
            </div>
          </div>
          <div className="pkg-grid">
            <div className="pkg-card">
              <div className="pkg-badge">기초 패키지</div>
              <span className="pkg-icon">🌱</span>
              <div className="pkg-name">Starter</div>
              <div className="pkg-title">홈페이지를<br />처음 만들어요</div>
              <p className="pkg-desc">브랜드 방향 잡기부터 사이트 배포까지. 아무것도 없어도 괜찮아요.</p>
              <div className="pkg-target">
                <strong>이런 분께 맞아요</strong>
                홈페이지 자체가 없거나, AI로 만들었는데 어떻게 올릴지 모르는 분
              </div>
              <ul className="pkg-items">
                <li>브랜드 방향 1회 진단 (업종 공식 기반)</li>
                <li>SEO 관점 사이트 구조 설계 안내</li>
                <li>AI 사이트 제작 가이드 제공</li>
                <li>AISEO 플랫폼으로 배포 (직접 진행)</li>
                <li>GA4 + 서치콘솔 세팅 교육</li>
              </ul>
              <a href="/?auth=signup" className="btn-pkg outline">상담 신청하기</a>
            </div>

            <div className="pkg-card featured">
              <div className="pkg-badge">가장 많이 선택</div>
              <span className="pkg-icon">⚡</span>
              <div className="pkg-name">Standard</div>
              <div className="pkg-title">브랜드는 있는데<br />검색이 안 돼요</div>
              <p className="pkg-desc">브랜드와 콘텐츠는 갖춰진 상태. SEO 최적화와 마케팅 연동이 핵심.</p>
              <div className="pkg-target">
                <strong>이런 분께 맞아요</strong>
                인스타·블로그는 운영 중인데, 구글 검색에서 안 나오는 분
              </div>
              <ul className="pkg-items">
                <li>업종 키워드 시장조사 리포트</li>
                <li>SEO 기반 사이트 구조 재설계</li>
                <li>AI 사이트 제작 + AISEO 배포</li>
                <li>GA4 · Google Ads · 서치콘솔 세팅</li>
                <li>Naver 웹마스터 연동</li>
                <li>배포 후 2주 피드백 지원</li>
              </ul>
              <a href="/?auth=signup" className="btn-pkg primary">상담 신청하기 →</a>
            </div>

            <div className="pkg-card">
              <div className="pkg-badge yellow">성장 패키지</div>
              <span className="pkg-icon">📈</span>
              <div className="pkg-name">Growth</div>
              <div className="pkg-title">사이트는 있는데<br />매출이 정체예요</div>
              <p className="pkg-desc">이미 기반은 갖춰진 상태. 데이터 분석과 광고, AEO로 다음 단계로.</p>
              <div className="pkg-target">
                <strong>이런 분께 맞아요</strong>
                홈페이지 운영 중이나 방문자·전환율 성장이 멈춘 분
              </div>
              <ul className="pkg-items">
                <li>GA4 데이터 분석 리뷰 (월 or 분기)</li>
                <li>Google Ads 광고 세팅 교육</li>
                <li>AEO(AI 검색 최적화) 방향 컨설팅</li>
                <li>경쟁사 SEO 벤치마킹 리포트</li>
                <li>콘텐츠 전략 제안</li>
                <li>지속 성장을 위한 월별 리뷰</li>
              </ul>
              <a href="/?auth=signup" className="btn-pkg outline">상담 신청하기</a>
            </div>
          </div>
        </div>
      </section>

      {/* TECH */}
      <section className="tech" id="tech">
        <div className="section-inner">
          <div className="section-tag">기술 인프라</div>
          <h2 className="section-title">안정적인 인프라,<br />개발자 없이도 가능합니다</h2>
          <div className="tech-grid">
            <div className="tech-list">
              {[
                { icon: '🔍', title: 'SEO 5대 항목 자동 검증', desc: 'index.html, robots.txt, sitemap.xml, title 태그, meta description을 업로드 즉시 자동으로 체크합니다.' },
                { icon: '📊', title: '마케팅 코드 원클릭 삽입', desc: 'GA4 측정 ID, Google Ads, 서치콘솔, 네이버 웹마스터 코드를 ID만 입력하면 자동 삽입됩니다.' },
                { icon: '🚀', title: 'AWS 기반 글로벌 CDN 배포', desc: 'S3 + CloudFront로 즉시 HTTPS 배포. 별도 호스팅 비용 없이 {내이름}.aiseo.tips로 접속 가능합니다.' },
                { icon: '🔒', title: 'SSL 자동 적용', desc: '배포 즉시 HTTPS 인증서 자동 발급. 검색엔진 신뢰도와 보안 모두 해결됩니다.' },
              ].map((t) => (
                <div className="tech-item" key={t.title}>
                  <div className="tech-dot">{t.icon}</div>
                  <div>
                    <h4>{t.title}</h4>
                    <p>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="tech-visual">
              <div className="seo-result">
                <div className="seo-result-title">
                  SEO 검증 결과
                  <span className="seo-score">4/5 통과</span>
                </div>
                <div className="seo-bars">
                  {[
                    { label: 'index.html', pct: 100, pass: true },
                    { label: 'robots.txt', pct: 30, pass: false },
                    { label: 'sitemap.xml', pct: 100, pass: true },
                    { label: 'title 태그', pct: 100, pass: true },
                    { label: 'meta desc', pct: 100, pass: true },
                  ].map((b) => (
                    <div className="seo-bar-item" key={b.label}>
                      <span style={{ width: 120, flexShrink: 0 }}>{b.label}</span>
                      <div className="seo-bar-bg"><div className={`seo-bar-fill${b.pass ? '' : ' fail'}`} style={{ width: `${b.pct}%` }}></div></div>
                      <span>{b.pass ? '✅' : '⚠️'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 16, fontSize: 13, color: '#15803d', lineHeight: 1.6 }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>💡 robots.txt 해결 가이드</strong>
                ZIP 파일 최상위에 robots.txt를 추가하세요.<br />
                <code style={{ fontSize: 11, background: 'white', padding: '2px 6px', borderRadius: 4 }}>User-agent: *<br />Allow: /</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / FAQ */}
      <section className="trust" id="trust">
        <div className="section-inner">
          <div className="section-tag">자주 묻는 질문</div>
          <h2 className="section-title">궁금한 점이 있으신가요?</h2>
          <div className="trust-grid">
            {[
              { q: '🤔 개발을 전혀 몰라도 되나요?', a: '네, 완전히 가능합니다. AI(ChatGPT, Claude)로 만든 웹사이트 파일을 ZIP으로 압축해서 올리기만 하면 됩니다. AI 사이트 제작 방법도 패키지에 포함됩니다.' },
              { q: '🌐 별도 도메인이나 호스팅이 필요한가요?', a: '필요 없습니다. {내이름}.aiseo.tips 주소로 즉시 접속 가능하며, 호스팅 비용도 없습니다. 향후 커스텀 도메인 연결도 지원 예정입니다.' },
              { q: '📱 사이트 수정이 필요하면 어떻게 하나요?', a: 'AI로 수정한 후 다시 ZIP으로 업로드하면 됩니다. 마케팅 코드 설정은 저장되어 있어 재배포 시 자동으로 적용됩니다.' },
              { q: '📊 GA4를 연결하면 뭘 볼 수 있나요?', a: '내 사이트 방문자 수, 어디서 왔는지(검색/SNS/직접), 어느 페이지를 오래 보는지 등을 확인할 수 있습니다. 광고 효과 측정도 가능합니다.' },
              { q: '🔍 배포하면 바로 구글에 나오나요?', a: '배포 후 Google Search Console에 제출하면 수일~수주 내 검색 결과에 노출됩니다. 서치콘솔 등록 방법은 배포 완료 후 안내드립니다.' },
              { q: '💡 1인 기업인데 어떤 패키지가 맞나요?', a: '홈페이지가 아예 없으면 기초 패키지, 인스타·블로그는 있는데 검색이 안 되면 스탠다드, 운영 중인데 성장이 멈췄으면 성장 패키지를 추천드립니다.' },
            ].map((faq) => (
              <div className="trust-card" key={faq.q}>
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-final">
        <div>
          <h2>오늘, 검색되는<br />홈페이지를 시작하세요</h2>
          <p>가방 공방, 웨딩스냅, 공예 클래스… 어떤 업종이든 가능합니다.</p>
          <div className="cta-buttons">
            <a href="/?auth=signup" className="btn-white">무료로 시작하기 →</a>
            <a href="#packages" className="btn-ghost-white">서비스 구성 보기</a>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <strong>AISEO</strong> — AI 웹사이트 SEO 최적화 배포 플랫폼<br />
        <span style={{ marginTop: 6, display: 'block' }}>prod: aiseo.tips | 사업자 문의: philo.productiongroup@gmail.com</span>
      </footer>
    </>
  );
}
