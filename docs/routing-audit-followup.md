# 라우팅 점검 후속 체크리스트 (Post-Blog Routing Audit)

> 블로그 8 페이즈 작업이 안정화된 후에 한 번 정리할 항목들을 잊어버리지
> 않게 메모해 두는 문서. **지금 작업하지 말 것.** 결정은 블로그 기능이
> 완료·검증된 뒤에 별도 작업으로 다룬다.

## 배경

블로그 Phase 3 에서 `BrowserRouter` 와 `HelmetProvider` 를 `main.tsx` 로
호이스팅하면서, 이 앱에는 **4 가지 라우팅 패러다임이 동시에 존재**하게 됨:

| # | 메커니즘 | 사용처 | 예시 |
|---|---|---|---|
| 1 | `?auth=*` 쿼리 + early-return | 로그인/회원가입/비번찾기 | `/?auth=login` |
| 2 | `#xxx` hash listener + state | 비인증 공개 sub-page | `/#course`, `/#support`, `/#events`, `/#blog` |
| 3 | react-router path (`<Routes>`) | 인증 후 대시보드 | `/brand`, `/products`, `/admin/...` |
| 4 | react-router path (`<Routes>`) — Phase 5/6 신규 | 공개 블로그 | `/blog`, `/blog/:slug` |

이 4 가지가 한 SPA 안에 공존하는 게 단기적으로는 동작하지만, 장기적으로는
정리할 가치가 있음. 이 문서는 그 정리 작업을 시작할 때 빠뜨리지 않을 점들을
모아둔 체크리스트.

## 점검 체크리스트

### 1. 해시 기반 공개 sub-page 를 실제 경로로 마이그레이션
- [ ] `/#course` → `/course` (수강안내, `CoursePage` 컴포넌트 그대로 재사용)
- [ ] `/#support` → `/support`
- [ ] `/#events` → `/events`
- [ ] `/#blog` → `/blog` (Phase 5 에서 이미 처리됨 — 확인만)
- [ ] **이유**: SEO·공유 URL 일관성 (해시는 검색 엔진이 별도 페이지로 인덱싱
      하지 않음), 새로고침/북마크 동작 일관, 구글 애널리틱스 page view 추적
      편의성
- [ ] **선결 조건**: CloudFront SPA fallback 이 새 경로들을 모두 처리하는지
      확인 (`infra/cloudfront/subdomain-router.js:24-34`)
- [ ] **사이드 이펙트**: `PublicSubPage.tsx:46-49,64-67` 의 `<a href="/#xxx">`
      를 `<Link to="/xxx">` 로 교체 — 페이지 전체 리로드 방지

### 2. `?auth=*` 쿼리 early-return → 정식 라우트 전환
- [ ] `/?auth=login` → `/login`
- [ ] `/?auth=signup` → `/signup`
- [ ] `/?auth=forgot-password` → `/forgot-password`
- [ ] `App.tsx:157-159` 의 `URLSearchParams` 체크와 `App.tsx:215-217` 의
      early-return 3개 줄을 라우트로 대체
- [ ] **이유**: 새로고침/뒤로가기/북마크 일관성, 라우터 안에 들어가면 router
      훅 (예: `useNavigate`) 도 자연스럽게 사용 가능
- [ ] **사이드 이펙트**: 네비게이션 (`PublicSubPage.tsx:52-53,70-71`) 의
      `/?auth=login` 링크 다 교체

### 3. `currentHash` state + `hashchange` listener 제거 가능 여부
- [ ] 1번을 끝낸 뒤 `App.tsx:174-181` 의 hashchange listener 와 `currentHash`
      state, `subPages` 매핑이 더 이상 필요한지 확인 → 제거
- [ ] **이유**: 미러 상태 (라우터 + 해시 + state) 가 사라져 단일 진실 소스 확보

### 4. CloudFront SPA fallback 검증
- [ ] `infra/cloudfront/subdomain-router.js:24-34` 가 다음 경로들을 모두
      `/site/index.html` 로 fallback 하는지 확인:
  - `/blog`, `/blog/<slug>`
  - 1번 후 `/course`, `/support`, `/events`
  - 2번 후 `/login`, `/signup`, `/forgot-password`
- [ ] 정적 자산 경로 (`/assets/*`, `/favicon.ico` 등) 가 fallback 되지 않는지
      negative test 도 포함

### 5. 내부 네비게이션 `<a href>` → `<Link>` 일제 교체
- [ ] `PublicSubPage.tsx` 의 nav/mobile-menu/CTA 링크들
- [ ] `LandingPage.tsx` 안의 내부 링크들 (외부 링크는 그대로)
- [ ] **이유**: SPA 즉시 전환, scroll position 보존 옵션, prefetch 가능성
- [ ] **주의**: `<a>` 가 의도적으로 풀 리로드를 원하는 곳 (예: 인증 상태
      리셋이 필요한 logout 후 이동) 은 그대로 유지

### 6. 404 / catch-all 라우트 정책
- [ ] 현재 인증 후 대시보드 브랜치는 `App.tsx:311` 의 `path="*"` →
      `/site/upload` redirect 가 있음
- [ ] 비인증 브랜치는 catch-all 이 없음 → 알 수 없는 path 에서 어떤 페이지가
      보일지 정의 필요
- [ ] **결정 필요**: 404 페이지 컴포넌트를 만들지 vs 메인으로 리다이렉트할지

### 7. LoginPage/SignupPage/ForgotPasswordPage 의 react-router 활용 여부
- [ ] Phase 3 호이스팅으로 이 페이지들도 router context 안에 들어왔음
- [ ] 현재는 props (`onLoginSuccess`) 와 `window.location` 으로 동작
- [ ] `useNavigate` / `useLocation` 으로 전환 시 이득과 비용 평가
- [ ] 2번 (정식 라우트 전환) 과 함께 처리하는 게 자연스러움

### 8. 동일 도메인 내 외부 영역과의 충돌 확인
- [ ] `site.dev.aiseo.tips/site/index.html` (CloudFront fallback target)
- [ ] `site.dev.aiseo.tips/admin/...` (어드민 라우트가 사이트 ID 와 충돌하지
      않는지)
- [ ] 다중 도메인 (dev, prod, b2b) 빌드에서 라우팅 동작 회귀 테스트

### 9. 네비게이션 가드 / 인증 보호 라우트 정형화
- [ ] 현재 "인증 안 되었으면 LandingPage / 인증되었으면 Dashboard" 분기는
      `if (!user)` 단일 조건문
- [ ] 라우트 단위로 보호하는 `<ProtectedRoute>` 패턴이 장기적으로 더 나은지
      검토 (예: 어드민 전용 페이지를 비-어드민이 path 로 직접 접근했을 때 처리)

### 10. URL state 와 컴포넌트 state 의 동기화 정책
- [ ] 블로그 목록 페이지 필터 (`?category=`, `?tag=`, `?page=`) 는 URL 이
      유일 진실 소스인지, 컴포넌트 state 와 양방향 동기화인지 명시
- [ ] `useSearchParams` 사용 정책

## 검토 시점

- 블로그 Phase 8 (배포 + E2E 검증) 완료 후
- 어드민으로 글 5–10 개 작성·운영하면서 실제 사용 패턴 관찰한 뒤
- 위 항목들을 우선순위 매겨서 별도 작업 (또는 페이즈) 으로 분리

## 참고 파일 (현재 시점)

- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/pages/public/PublicSubPage.tsx`
- `frontend/src/pages/public/CoursePage.tsx`
- `frontend/src/auth-pages.tsx` (Login/Signup/ForgotPassword)
- `infra/cloudfront/subdomain-router.js`
- `docs/blog-feature-overview.md` — 블로그 페이즈 전체 개요
