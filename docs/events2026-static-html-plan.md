# events2026 페이지 정적 HTML 변환 — 실행 계획서

> **Status**: 계획 수립 완료, 미실행
> **Branch suggestion**: `claude/events2026-static-html`
> **예상 commit 수**: 6 개 (Phase 1~6)
> **예상 라인 변경량**: ~6500 라인 React 변환 + ~2000 라인 신규 vanilla
> **선행 조건**: 본 문서를 읽은 신규 세션에서 Phase 0 (사전 분석) 부터 순서대로 실행. 각 Phase 는 독립 커밋 + 검증 후 다음으로 이동.

---

## 0 · 배경 (왜 하는가)

`site.aiseo.tips` 는 React/Vite SPA. raw HTML 은 `<head>` 의 OG 메타 + `<div id="root"></div>` 만 반환 — 본문 ~2 KB. JS 비실행 클라이언트 (Claude, GPTbot, curl 기반 SEO 도구, 일부 검색봇) 는 페이지 본문을 못 봄.

`frontend/scripts/prerender.mjs` 는 이름과 달리 **head 메타만 라우트별로 주입** — body 는 SPA 쉘 그대로. OG 카드는 라우트별로 다르지만 본문은 동일.

사용자 결정: 이벤트 3개 페이지 (`/events2026`, `/events2026/free`, `/events2026/paid`) 를 **정적 HTML 로 1:1 변환**. 인터랙션 (3D 플립 카드, 스크롤 단계 라이팅, 카운트다운, FAQ 아코디언, EventSignupModal) 도 vanilla 로 픽셀 단위 재현.

### Out of scope (본 차수 밖)

- `/course2026`, `/support2026` 등 다른 마케팅 페이지 정적화 — 같은 패턴으로 후속.
- 본격 SSR/SSG (Vike, vite-plugin-ssr) 전환 — 본 변환 성공 시 후속에서 검토.
- 블로그 (`/blog/{slug}`) — 이미 backend Lambda 가 prerender 함 (별도 시스템).

---

## 1 · 아키텍처 결정

### 1.1 파일 배치 — Vite static asset 패턴 활용

```
frontend/public/events2026/
├── index.html              ← /events2026  (hub)
├── free/index.html         ← /events2026/free
├── paid/index.html         ← /events2026/paid
├── events-config.js        ← API_BASE_URL placeholder (deploy 시 sed 치환)
├── events-shared.css       ← 3 페이지 공통 CSS
├── events-shared.js        ← 3 페이지 공통 JS (nav, 모달, GA4, Cognito 체크)
└── (이미지/비디오 자산은 기존 frontend/public/events/, /hero.mp4 재사용)
```

Vite 가 `public/` 을 그대로 `dist/` 로 복사 → 기존 `aws s3 sync frontend/dist/` 가 `s3://$BUCKET/site/events2026/` 로 업로드.

### 1.2 prerender.mjs 와의 충돌 방지

현재 `frontend/scripts/prerender.mjs` ROUTES 에 `/events2026`, `/events2026/free`, `/events2026/paid` 3개 포함. 빌드 후 실행되어 `dist/events2026/index.html` 등을 **덮어쓰기**.

→ 이 3개 항목을 ROUTES 배열에서 **제거**. 그러면 dist 에 우리 정적 HTML 만 남음.

### 1.3 CloudFront 라우팅 — 변경 불필요

`infra/cloudfront/subdomain-router.js` 의 `PRERENDERED_FIXED` 맵에 `/events2026*` 라우팅이 이미 있음. 새 정적 HTML 을 같은 S3 경로 (`s3://$BUCKET/site/events2026/...`) 에 올리면 자동으로 서빙됨. **인프라 코드 수정 0 줄.**

### 1.4 CSS 의존성 처리

React 페이지들은 `frontend/src/pages/landing.css` (1745 라인) 의 `.hero`, `.landing-nav`, `.video-reveal-section`, `.footer`, `.btn-primary` 등 다수를 import. 정적 HTML 은 빌드 후 해시되는 dist/assets/*.css 를 참조할 수 없음 (해시 변동).

**방침**: 필요한 landing.css 규칙만 추려 `events-shared.css` 에 복사. 추가로 페이지별 scoped 스타일 (`.evtmain`, `.evtfree`, `.evtpaid`) 은 각 HTML 의 `<style>` 블록에 그대로 인라인.

### 1.5 EventSignupModal — vanilla 4-step 폼

`frontend/src/components/EventSignupModal.tsx` (413 라인) 의 4-step 신청 폼을 vanilla DOM + 상태머신으로 재작성. 3개 페이지에서 `data-open-signup` + `data-event="EVENT_01_FREE|02|03"` 어트리뷰트로 트리거.

백엔드 `/event-signup` 엔드포인트는 공개 (auth 불필요) — `fetch(API_BASE_URL + '/event-signup', {...})` 로 직접 호출.

### 1.6 Nav / Footer / Cognito / GA4

- 좌측 "AISEO" 로고, 우측 메뉴 (수강안내·지원서비스·이벤트·블로그) + 로그인/시작 CTA
- 우측 계정 아이콘 — `localStorage.getItem('aiseo.idToken')` 유효성 검사 후 `/login.html` 또는 `/account.html` 분기
- GA4 (`G-M4B8Z8RJPL`) + GTM 태그 헤드에 인라인
- 스크롤 시 docked nav 전환 (`useSubPageNav` 의 vanilla 포팅)

→ 모두 `events-shared.css` + `events-shared.js` 에 1회 작성, 3개 페이지에서 동일하게 마크업 복붙.

### 1.7 한글 인코딩 (mojibake 방지)

`reader-config.js` 패턴: ASCII-only 인 config 파일만 `sed` 치환, 한글 포함 HTML 본체는 바이트 그대로 업로드. PowerShell 환경에서도 안전.

---

## 2 · 변경 대상 파일 매트릭스

| 파일 | 액션 | Phase |
|---|---|---|
| `frontend/public/events2026/events-config.js` | 신규 | 1 |
| `frontend/public/events2026/events-shared.css` | 신규 | 1 |
| `frontend/public/events2026/events-shared.js` | 신규 | 1 |
| `frontend/scripts/prerender.mjs` | 수정 (ROUTES 3개 제거) | 1 |
| `scripts/deploy-dev.sh` | 수정 (events-config.js sed 블록 추가) | 1 |
| `scripts/deploy-dev.ps1` | 수정 (동일) | 1 |
| `scripts/deploy-prod.sh` | 수정 (동일) | 1 |
| `scripts/deploy-prod.ps1` | 수정 (동일) | 1 |
| `frontend/public/events2026/index.html` | 신규 | 2 |
| `frontend/public/events2026/free/index.html` | 신규 | 3 |
| `frontend/public/events2026/paid/index.html` | 신규 | 4 |
| EventSignupModal vanilla 구현 (`events-shared.js` 에 통합) | 구현 | 5 |
| `frontend/src/App.tsx` | 수정 (events2026 Route 3개 제거, 선택) | 6 |
| `infra/cloudfront/subdomain-router.js` | 미변경 | — |

---

## 3 · Phase 별 상세 실행 계획

각 Phase 는 자체 완결되며 신규 세션이 해당 Phase 만 읽고도 실행 가능하도록 작성.

---

### Phase 0 · 사전 분석 (커밋 없음)

**목적**: 작업 시작 전 의존성 그래프 + 카피 인벤토리 확정.

**할 일**:
1. 다음 4 파일을 통째로 정독:
   - `frontend/src/pages/public/Events2026Page.tsx` (1145 라인) — hub
   - `frontend/src/pages/public/Events2026FreePage.tsx` (2427 라인) — 3D 플립
   - `frontend/src/pages/public/Events2026PaidPage.tsx` (2538 라인) — 카운트다운·FAQ
   - `frontend/src/components/EventSignupModal.tsx` (413 라인) — 신청 폼
2. `frontend/src/pages/landing.css` (1745 라인) 중 events 페이지가 의존하는 클래스 식별:
   - `.hero`, `.hero-bg`, `.hero-noise`, `.hero-grid`, `.hero-content`, `.hero-badge*`, `.hero-h1`, `.hero-sub`, `.accent-text`
   - `.landing-nav`, `.nav-*`, `.nav-mobile-menu`, `.nmm-*`
   - `.video-reveal-section`, `.video-reveal-sticky`, `.video-frame-wrap`, `.video-bg-glow`, `.video-progress-bar`, `.video-scroll-hint`, `.vt-*` (썸네일)
   - `.footer`, `.footer-inner`, `.footer-bottom`
   - `.btn-ghost`, `.btn-primary`
   - CSS 변수 (`:root` 의 `--accent`, `--accent-dark`, `--accent-light`, `--bg`, `--bg-soft`, `--bg-card`, `--border`, `--radius-*`, `--shadow-*`, `--text-*`, `--font-*` 등)
3. `frontend/src/pages/public/useSubPageNav.ts` 정독 (nav 스크롤 전환 + 햄버거 로직)
4. `frontend/src/api.ts` 의 `submitEventSignup` 시그니처 + 백엔드 엔드포인트 페이로드 확정
5. `frontend/src/constants/contact.ts` 의 `KAKAO_CHAT_URL` 추출
6. `frontend/public/library/index.html` + `frontend/public/library/reader/index.html` 의 nav/footer/모달 패턴 참고 — 같은 톤으로 작성

**산출물**: 본 단계 결과를 임시 메모 파일 (`/tmp/events-css-deps.txt` 등) 에 정리. 커밋 없음.

**완료 기준**: events-shared.css 에 복사할 landing.css 셀렉터 목록이 손에 잡힘.

---

### Phase 1 · 공통 인프라 (Commit A)

**목적**: 3 페이지 공통 자산 + 빌드/배포 인프라 정비. 정적 HTML 본체는 아직 없음 — 인프라만.

**할 일**:

1. **`frontend/public/events2026/events-config.js` 작성** (reader-config.js 패턴):
   ```js
   // sed 치환 대상: __API_BASE_URL__, __COGNITO_REGION__, __USER_POOL_ID__, __CLIENT_ID__
   window.AISEO_EVENTS_CONFIG = {
     apiBaseUrl: '__API_BASE_URL__',
     cognito: {
       region: '__COGNITO_REGION__',
       userPoolId: '__USER_POOL_ID__',
       clientId: '__CLIENT_ID__',
     },
     ga4: 'G-M4B8Z8RJPL',
   };
   ```

2. **`frontend/public/events2026/events-shared.css` 작성**:
   - Phase 0 에서 추린 landing.css 셀렉터들을 복사 (CSS 변수 `:root` 포함)
   - nav (`.landing-nav`, `.nav-*`), 모바일 메뉴 (`.nav-mobile-menu`, `.nmm-*`), 푸터, 버튼 (`.btn-ghost`, `.btn-primary`), hero 공통, video-reveal
   - 신규: EventSignupModal CSS (`#event-signup-modal`, `.modal-card`, `.step`, step indicator, 필드 검증 상태)

3. **`frontend/public/events2026/events-shared.js` 작성**:
   - `useSubPageNav` vanilla 포팅: 스크롤 시 nav 도크 클래스 토글, 햄버거 토글, 모바일 메뉴 외부 클릭 닫기
   - Cognito 토큰 유효성 검사 → 우측 아이콘 분기 (`/login.html` vs `/account.html`)
   - GA4 + GTM 초기화
   - EventSignupModal 4-step 상태머신:
     - `openSignup(eventCode)` 함수 export
     - `data-open-signup` 어트리뷰트 가진 모든 버튼에 이벤트 바인딩
     - step 1: 이름·전화 (필수, 전화 regex 검증)
     - step 2: 업종·지역 (필수)
     - step 3: 사이트 유무·고민 (라디오 + textarea)
     - step 4: 카카오 동의 (체크박스, optional)
     - 제출: `fetch(config.apiBaseUrl + '/event-signup', {method: 'POST', body: JSON.stringify(payload)})`
     - 성공: 완료 화면 + GA4 `event_signup_submit` 발사
     - 에러: 토스트

4. **`frontend/scripts/prerender.mjs` 수정**: ROUTES 배열에서 `/events2026`, `/events2026/free`, `/events2026/paid` 3개 객체 삭제 (라인 73~87 부근).

5. **deploy 스크립트 4종 수정** (`scripts/deploy-{dev,prod}.{sh,ps1}`):
   - `aws s3 sync frontend/dist/ s3://$BUCKET/site/` 의 exclude 리스트에 `--exclude "events2026/events-config.js"` 추가 (sed 후 별도 업로드용)
   - 그 아래 reader-config.js sed 블록 다음에 events-config.js 동등 블록 추가:
     ```bash
     sed -e "s|__API_BASE_URL__|$API_BASE_URL|g" \
         -e "s|__COGNITO_REGION__|$COGNITO_REGION|g" \
         ... \
         frontend/public/events2026/events-config.js > /tmp/aiseo-events-config.js
     aws s3 cp /tmp/aiseo-events-config.js \
       s3://$BUCKET/site/events2026/events-config.js \
       --content-type "application/javascript; charset=utf-8" --profile $PROFILE
     rm /tmp/aiseo-events-config.js
     ```
   - PowerShell 버전은 `-replace` + `Out-File -Encoding utf8` 사용 (mojibake 방지)
   - sh 와 ps1, dev 와 prod 모두 4 파일 동일하게 수정 (deploy-prod 는 prod API_BASE_URL 사용)

**검증**:
- `cd frontend && npm run build` 통과 (prerender.mjs 가 events 라우트 안 만들어도 에러 없는지)
- dist/ 에 events2026/ 디렉토리 + events-config.js + events-shared.{css,js} 가 들어왔는지
- `node frontend/scripts/prerender.mjs` 로그에 events2026 가 나오지 않는지

**완료 기준**: 빌드 통과 + dist 산출물에 공통 자산 3종 존재 + deploy 스크립트 4종 sed 블록 추가.

**커밋 메시지**: `events2026 정적화 (A): 공통 CSS/JS/config + prerender·deploy 정비`

---

### Phase 2 · `/events2026` Hub 페이지 정적 HTML (Commit B)

**목적**: 가장 단순한 페이지로 패턴 검증. Phase 3~4 에서 같은 패턴 반복 사용.

**소스**: `frontend/src/pages/public/Events2026Page.tsx` (1145 라인)

**할 일**: `frontend/public/events2026/index.html` 작성. 다음 섹션을 React → vanilla HTML 로 1:1 변환:

1. **HEAD**: title, meta description, canonical, OG (hub 용 — prerender.mjs 에 있던 값 그대로), Twitter card, GA4 인라인 스크립트, GTM, `events-shared.css` link, `events-config.js` script
2. **NAV**: React 의 `<nav id="mainNav" className="landing-nav">` 마크업 그대로 (className → class), 하위 메뉴 (`.nav-item-has-sub > .nav-submenu`) 포함
3. **모바일 메뉴**: `<div className="nav-mobile-menu" id="navMobileMenu">` 그대로
4. **HERO**: `<section className="hero events-hero-v1">` + `.hero-bg`/`.hero-noise`/`.hero-grid`/`.hero-content` + 배지 + h1 (3줄 word span) + sub
5. **VIDEO REVEAL**: `<div className="video-reveal-section">` 마크업 + iframe + 썸네일 + 진행 바
6. **`<main className="evtmain">`** 안:
   - 솔직히 말하면 (`.solidly`)
   - 진행 중인 이벤트 (`.events-list` — 2 개 카드, 각각 `/events2026/free`, `/events2026/paid` 링크)
   - HOW IT WORKS (`.how` — 4 단계 그리드)
   - COMMON BENEFIT (`.common` — 6 업종 카드 + 검색어 예시 + 광고 아님 + 음식점 제외)
   - 마지막 CTA (`.final-cta` — 3 버튼)
7. **FOOTER**

8. **인라인 `<style>` 블록**: React 의 `<style>{...}</style>` 두 블록 (hero-bg 오버라이드 + `.evtmain` 스코프, 라인 169-751) 을 그대로 복사 — backtick 템플릿만 일반 텍스트로

9. **인라인 `<script>` 블록**:
   - video reveal IntersectionObserver + rAF 루프 (React useEffect 코드 라인 28~131 을 vanilla 로 — 이미 DOM API 만 쓰므로 React 훅 껍데기만 벗기면 됨)
   - `events-shared.js` 가 자동 처리하는 nav/모달은 추가 코드 없음

**검증**:
- 로컬에서 `frontend/public/events2026/index.html` 을 브라우저로 직접 열기 (API_BASE_URL 미치환 상태라 모달 제출은 실패해도 OK, 모달 UI 만 확인)
- 비디오 reveal 스크롤 시 React 버전과 픽셀·이징 동일한지 비교
- `npm run build && cat dist/events2026/index.html | wc -c` → 50 KB+ (본문이 들어있음)

**완료 기준**: 빌드 산출물 dist/events2026/index.html 이 React 페이지와 시각적으로 동일하게 렌더, 모든 링크 + 비디오 reveal 동작.

**커밋 메시지**: `events2026 정적화 (B): hub 페이지 /events2026 정적 HTML`

---

### Phase 3 · `/events2026/free` 정적 HTML (Commit C)

**목적**: 가장 복잡한 페이지. 3D 플립 카드 + 스크롤 단계 페이즈 라이팅 + 모달.

**소스**: `frontend/src/pages/public/Events2026FreePage.tsx` (2427 라인)

**할 일**: `frontend/public/events2026/free/index.html` 작성. 변환 포인트:

1. **HEAD/NAV/모바일 메뉴/푸터**: Phase 2 와 동일 패턴 (현재 페이지 표시는 `/events2026/free` 의 active 클래스 위치만 변경)

2. **HERO**: free 페이지 hero (자체 카피 + 배지 + h1)

3. **3D 플립 카드 그리드**:
   - React state (`flipped: number[]`) → 각 카드 DOM 에 `data-flipped="0|1"` 어트리뷰트
   - CSS 규칙은 그대로 (`transform: rotateY(180deg)`, `transform-style: preserve-3d`)
   - 카드 클릭/자동 플립 (setInterval 회전) → vanilla:
     ```js
     const cards = document.querySelectorAll('.flip-card');
     cards.forEach(c => c.addEventListener('click', () => {
       c.dataset.flipped = c.dataset.flipped === '1' ? '0' : '1';
     }));
     // 자동 플립
     setInterval(() => { ... }, AUTO_FLIP_INTERVAL_MS);
     ```

4. **스크롤 단계 페이즈 라이팅** (`headerProgress()` easing):
   - React useEffect 안의 rAF + scroll handler 를 IIFE 로 변환
   - easing 함수 + rgba 보간 수식 그대로 복붙
   - 영향받는 DOM 셀렉터 (헤더 배경, 그라데이션 등) 도 그대로

5. **확장형 CORE 배포 카드**:
   - `useState(expanded)` → 카드 root 에 클릭 핸들러: `el.classList.toggle('expanded')`

6. **EventSignupModal 트리거 버튼**: `data-open-signup data-event="EVENT_01_FREE"` 어트리뷰트만 부여, 모달 자체는 events-shared.js 의 `openSignup()` 이 처리

7. **인라인 `<style>` + `<script>`**: React 컴포넌트 안 CSS-in-JS 블록 모두 인라인 복사 (대용량 — ~1500 라인 CSS 예상)

**검증**:
- 3D 플립 — 카드 클릭 시 회전, 자동 회전 타이머 동작
- 스크롤 페이즈 — 페이지 상단 → 중단 → 하단 진행에 따라 라이팅 변화
- 확장형 CORE 카드 — 클릭 시 펼침/접힘
- 모달 — `EVENT_01_FREE` 페이로드로 신청 진행, 백엔드 응답 200

**완료 기준**: React 버전과 시각·인터랙션 동일. dist 빌드 산출물 100KB+ 본문.

**커밋 메시지**: `events2026 정적화 (C): /events2026/free + 3D 플립 + 페이즈 라이팅`

---

### Phase 4 · `/events2026/paid` 정적 HTML (Commit D)

**목적**: 카운트다운 + FAQ 아코디언 + 확장형 카드.

**소스**: `frontend/src/pages/public/Events2026PaidPage.tsx` (2538 라인)

**할 일**: `frontend/public/events2026/paid/index.html` 작성. 변환 포인트:

1. **HEAD/NAV/모바일/푸터**: Phase 2 동일 패턴, active 위치만 `/events2026/paid`

2. **HERO + 패키지 비교 그리드**: 2 개 패키지 카드 (EVENT 02 검색 전략, EVENT 03 콘텐츠 기획)

3. **확장형 카드 (Set state)**:
   - React `useState(new Set())` → vanilla 객체 `{}` + 각 카드 `data-id` 어트리뷰트
   - 클릭 시 `card.classList.toggle('expanded')` + 전역 상태 객체에 기록 (필요 시)

4. **FAQ 아코디언 (single-open)**:
   - React state `openFaq: string | null` → vanilla `let currentOpen = null`
   - 클릭 시: 현재 열린 항목 닫기 → 새 항목 열기 → currentOpen 업데이트
   - CSS transition (max-height) 으로 부드러운 펼침

5. **카운트다운 타이머** (목표일: 2026-04-30):
   ```js
   const target = new Date('2026-04-30T00:00:00+09:00');
   const tick = () => {
     const diff = target - Date.now();
     if (diff <= 0) { /* 만료 표시 */ return; }
     const d = Math.floor(diff / 86400000);
     const h = Math.floor((diff % 86400000) / 3600000);
     const m = Math.floor((diff % 3600000) / 60000);
     const s = Math.floor((diff % 60000) / 1000);
     document.getElementById('cd-d').textContent = d;
     // ... h, m, s
   };
   tick(); setInterval(tick, 1000);
   ```

6. **리빌 온 스크롤 fade-in**:
   - IntersectionObserver 로 `.reveal` 요소가 viewport 들어오면 `.in-view` 클래스 토글
   - CSS: `.reveal { opacity: 0; transform: translateY(20px); transition: ... } .reveal.in-view { opacity: 1; transform: none; }`

7. **EventSignupModal 트리거**: `data-event="EVENT_02_PAID"` 와 `EVENT_03_PAID` 두 종류 — 카드별로 다르게 부여

**검증**:
- 카운트다운 1초 간격으로 갱신 + 만료 시 적절히 표시
- FAQ — 한 항목 열면 다른 항목 자동 닫힘
- 확장형 카드 — 독립적으로 토글
- fade-in — 스크롤 시 부드럽게 등장
- 모달 — `EVENT_02_PAID` / `EVENT_03_PAID` 각각 백엔드 전송 성공

**완료 기준**: React 버전과 동일, 빌드 산출물 100KB+.

**커밋 메시지**: `events2026 정적화 (D): /events2026/paid + 카운트다운 + FAQ`

---

### Phase 5 · EventSignupModal 정밀화 + end-to-end 검증 (Commit E)

**목적**: 모달 검증·UX 다듬기 + dev 배포 후 실사용 환경에서 전체 동작 확인.

**할 일**:

1. **`EventSignupModal.tsx` 전체 정독 후 vanilla 구현 보강**:
   - 입력 검증 규칙 (전화번호 정규식, 빈 값, 길이 등) 1:1 복사
   - 단계 인디케이터 (1/4, 2/4, ...) 시각화
   - "이전" / "다음" 버튼 활성·비활성 상태
   - 제출 중 로딩 + 중복 클릭 방지
   - 성공 화면 (`수강 안내드리겠습니다`) 카피 정확히 일치
   - GA4 이벤트: `event_signup_open`, `event_signup_step_2`, ... `event_signup_submit` 발사 위치 React 와 동일하게
   - ESC / 외부 영역 클릭 시 닫기
   - 스크롤 잠금 (`body.modal-open { overflow: hidden }`)

2. **3 페이지 모달 트리거 점검**:
   - hub 페이지의 final-cta 버튼들 → 적절한 페이지로 이동만, 모달 띄우지 않음 (React 동작과 동일)
   - free 페이지의 메인 CTA → `EVENT_01_FREE` 모달
   - paid 페이지의 카드별 CTA → `EVENT_02_PAID` / `EVENT_03_PAID` 모달

3. **dev 배포 + e2e 검증**:
   - `./scripts/deploy-dev.sh` (또는 `.ps1`) 실행
   - CloudFront 인밸리데이션 완료 대기
   - 검증 항목:
     ```
     [ ] curl -s https://dev.aiseo.tips/events2026 | wc -c → 50KB+
     [ ] curl -s https://dev.aiseo.tips/events2026/free | wc -c → 100KB+
     [ ] curl -s https://dev.aiseo.tips/events2026/paid | wc -c → 100KB+
     [ ] curl -s https://dev.aiseo.tips/events2026 | grep -i "솔직히\|진행 중인 이벤트" → 본문 포함 확인
     [ ] 브라우저 (Chrome + Safari + 모바일) 에서 3 페이지 시각 비교
     [ ] 3D 플립 / 스크롤 페이즈 / 카운트다운 / FAQ 모두 동작
     [ ] 신청 폼 3 종 (FREE, PAID 02, PAID 03) 백엔드 전송 → admin event-signup 페이지에서 entry 확인
     [ ] Lighthouse SEO 점수 (이전 대비 향상 여부)
     ```

**완료 기준**: dev 환경에서 3 페이지 모두 React 동작과 1:1 일치. 신청 폼 3 종 백엔드 도달 확인.

**커밋 메시지**: `events2026 정적화 (E): 모달 정밀화 + dev e2e 검증`

---

### Phase 6 · App.tsx Route cleanup (Commit F, 선택)

**목적**: 코드 정리. React 가 도달하지 않는 죽은 Route 제거.

**할 일**:
1. `frontend/src/App.tsx` 에서 `<Route path="/events2026" ... />` 3 개 제거
2. `frontend/src/pages/public/Events2026{,Free,Paid}Page.tsx` 3 파일 삭제 (또는 `frontend/src/_archive/` 로 이동)
3. `frontend/src/components/EventSignupModal.tsx` 삭제 (vanilla 로 대체됨)
4. `frontend/src/api.ts` 의 `submitEventSignup` 호출처 없으면 함수도 제거 (호출처 grep 으로 확인)
5. 빌드 + 타입체크 통과 + dev 재배포 + 회귀 테스트

**완료 기준**: 빌드 통과 + 사이트 동작 동일.

**커밋 메시지**: `events2026 정적화 (F, cleanup): 죽은 React Route + 컴포넌트 제거`

---

## 4 · prod 배포 절차

dev 에서 Phase 5 검증 완료 후:

1. `./scripts/deploy-prod.sh` 실행
2. https://aiseo.tips/events2026 + /free + /paid curl + 브라우저 검증
3. 신청 폼 1 회씩 실제 제출 → admin 콘솔에서 확인 (테스트 entry 는 admin 에서 삭제)
4. Google Search Console / Naver Search Advisor 에 sitemap 재제출 (events2026 본문이 이제 인덱싱 가능)

---

## 5 · 실행 순서 요약 (신규 세션이 본 문서를 받았을 때)

1. **Phase 0** — 소스 정독 (커밋 없음, 1~2 시간)
2. **Phase 1** — 공통 인프라 (Commit A)
3. **Phase 2** — hub (Commit B)
4. **Phase 3** — free (Commit C, 최난이도)
5. **Phase 4** — paid (Commit D)
6. **Phase 5** — 모달 + dev 검증 (Commit E)
7. **Phase 6** — cleanup (Commit F, 선택)
8. prod 배포

각 Phase 종료 시 git commit + push (브랜치: `claude/events2026-static-html` 신규 생성). PR 은 명시 요청 시에만.

---

## 6 · 위험 요소

| 위험 | 완화 |
|---|---|
| landing.css 의존성이 발견된 것보다 많음 | Phase 0 에서 grep 으로 React 페이지가 사용하는 모든 클래스 추출, 누락된 건 Phase 2 빌드 검증 시 발견 → 추가 복사 |
| 한글 mojibake (Windows PowerShell deploy) | reader-config.js 패턴 그대로 — HTML 본체는 sync 가 바이트 그대로 옮김, sed 치환은 ASCII config 파일만 |
| 신청 폼 백엔드 페이로드 형식 불일치 | Phase 5 에서 dev 환경 실제 호출 → admin 콘솔에서 entry 확인. 형식 어긋나면 4xx 응답 보고 수정 |
| dist sync 가 events-config.js 의 placeholder 버전을 먼저 올림 | exclude 추가 + sed 후 별도 cp (reader-config.js 와 동일 패턴) |
| 3D 플립 / 페이즈 라이팅 픽셀 차이 | React 코드의 모든 매직 넘버 (easing 계수, rAF 주기, opacity 보간) 를 vanilla 로 그대로 복붙. 다른 값 쓰지 않음 |

---

## 7 · 본 문서 작성 시점 컨텍스트

- 작성일: 2026-06-04
- 작성자 세션: `synthetic-twirling-hopper` (직전 plan 의 §19 에서 발췌·재구성)
- 사용자 결정 사항: "3 페이지 모두" + "픽셀 단위 1:1 재현" + "본 plan 세분화하여 별도 md 로 저장 후 신규 세션 시작"
- 현재 git 브랜치: `claude/fix-css-mime-type-vR4bE` (스코프 불일치 — 신규 작업은 별도 브랜치 권장)
- 관련 사용자 이메일: dark.dduu@gmail.com
