# AISEO 랜딩 (site.aiseo.tips) 디자인 시스템 — 260602

> 추출 시점: 2026-06-02
> 소스: `frontend/src/styles/design-tokens.css` + `frontend/src/pages/landing.css`
> 범위: site.aiseo.tips (랜딩페이지) 의 토큰·타이포·간격·모션 정리
> 용도: 동일 톤으로 sub-page / b2b / 이메일·SNS 카드 디자인을 맞출 때 참고

---

## 1. 색상 (Design Tokens)

### 브랜드 액센트

| 토큰 | HEX/RGBA | 용도 |
|------|----------|------|
| `--accent` | `#C4A8F5` | 랜딩 메인 보라 (밝은 라일락) |
| `--accent-light` | `rgba(196,168,245,0.14)` | 호버/소프트 배경 |
| `--accent-mid` | `#9BB8F8` | 보조 (블루 톤) |
| `--accent-dark` | `#8B6FD4` | 진한 보라 (대시보드 CTA 기본) |
| `--primary` | `#8B6FD4` | `--accent-dark` 의 alias (UI 컨트롤) |
| `--primary-hover` | `#7A5BC4` | 버튼 hover |
| `--primary-soft` | `rgba(139,111,212,0.10)` | 활성 배경 |
| `--primary-soft-strong` | `rgba(139,111,212,0.18)` | 강조 활성 |

### 텍스트

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--text-primary` | `#0A0614` | 본문 (다크 보라-블랙) |
| `--text-secondary` | `#6B7280` | 보조 텍스트 |
| `--text-muted` | `#9CA3AF` | 약화 텍스트 |

### 표면 (배경)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--bg` | `#FFFFFF` | 기본 흰색 |
| `--bg-soft` | `#F9FAFB` | 살짝 회색 |
| `--bg-card` | `#FFFFFF` | 카드 |
| `--bg-app` | `#FAFAFC` | 앱 (대시보드) 배경 |

### 경계

| 토큰 | HEX |
|------|-----|
| `--border` | `#E5E7EB` |
| `--border-soft` | `#F3F4F6` |
| `--border-strong` | `#D1D5DB` |

### 상태

| 토큰 | HEX | Soft | Dark (텍스트) |
|------|-----|------|---------------|
| `--success` | `#10B981` | `rgba(16,185,129,0.10)` | `#047857` |
| `--warning` | `#F59E0B` | `rgba(245,158,11,0.12)` | `#92400E` |
| `--danger` | `#EF4444` | `rgba(239,68,68,0.10)` | `#991B1B` |

---

## 2. 타이포그래피

### 폰트 패밀리

| 토큰 | 값 |
|------|----|
| `--font-ko` | `'Noto Sans KR', system-ui, sans-serif` |
| `--font-en` | `'Plus Jakarta Sans', system-ui, sans-serif` |

> 영문/숫자는 Plus Jakarta Sans, 본문 한글은 Noto Sans KR.
> Plus Jakarta 는 weights `400,500,600,700,800`, Noto Sans KR 은 `300,400,500,700,900` 로딩.

### 폰트 사이즈 — 데스크탑 기준

| 요소 | 크기 | weight | line-height | letter-spacing |
|------|------|--------|-------------|----------------|
| **Hero H1** (`.hero-h1`) | **76 px** | 800 | 1.12 | -3 px |
| Hero 부제 (`.hero-sub`) | 19 px | 400 | 1.7 | — |
| Hero 배지 (`.hero-badge`) | 13 px | 600 | — | — |
| 섹션 H2 (`.section-h2`) | **42 px** | 700 | 1.2 | -1.5 px |
| 섹션 부제 (`.section-sub`) | 17 px | 400 | 1.7 | — |
| Section eyebrow | 13 px | 600 | — | 0.8 px (uppercase) |
| Stack title (`.sf-title`) | 36 px | 700 | 1.2 | -1.5 px |
| Stack sub (`.sf-sub`) | 16 px | 400 | 1.6 | — |
| 카드 H3 (`.sf-card-text h3`) | **28 px** | 700 | 1.22 | -1 px |
| 카드 본문 p | 14 px | 400 | 1.7 | — |
| 카드 feature item | 14 px | 400 | — | — |
| Video reveal h2 (`.video-reveal-label h2`) | 42 px | 700 | 1.2 | -1.5 px |
| Testimonial 인용 (`.testi-quote`) | `clamp(22px, 2.5vw, 36px)` | 600 | 1.38 | -0.8 px (Plus Jakarta) |
| Stat 숫자 (`.stat-num`) | 36 px | 800 | 1.0 | — (Plus Jakarta) |
| Stat 라벨 | 13 px | 400 | — | — |
| Nav 로고 | 20 px → 18 px (scrolled) | 800 | — | -0.5 px (Plus Jakarta) |
| Nav 링크 | 14 px | 500 | — | — |
| `.btn-primary` | 14 px | 700 | — | — |
| `.btn-primary-lg` | 15 px | 700 | — | — |
| `.btn-ghost` | 14 px | 500 | — | — |

### 폰트 사이즈 — 모바일 (≤ 600 px)

| 요소 | 모바일 값 |
|------|-----------|
| `.hero-h1` | **30 px** (letter-spacing -1.2 px) |
| `.hero-sub` | 13 px |
| `.hero-badge` | 11 px, padding `4px 12px` |
| `.section-h2` | 26 px (letter-spacing -0.8 px) |
| `.sf-title` | 26 px |
| `.testi-quote` | 18 px |

### 폰트 사이즈 — 태블릿 (≤ 900 px)

| 요소 | 값 |
|------|----|
| `.hero-h1` | 48 px (letter-spacing -2 px) |

---

## 3. 라운드 (Radius)

| 토큰 | 값 | 용도 |
|------|----|------|
| `--radius-sm` | 8 px | 작은 버튼, input |
| `--radius-md` | 12 px | 카드, 큰 버튼 |
| `--radius-lg` | 16 px | 큰 카드 |
| `--radius-xl` | 24 px | 패널 |

---

## 4. 그림자 (Shadow)

| 토큰 | 값 |
|------|----|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)` |
| `--shadow-lg` | `0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)` |

### 액센트 글로우 (특수)

- 1차 버튼: `0 4px 16px rgba(196,168,245,0.3)` → hover `0 8px 24px rgba(196,168,245,0.35)`
- Hero 영역 그라데이션/박스섀도는 별도 (다크 보이드 그라데이션 마스크 사용)

---

## 5. 레이아웃 / 간격

| 항목 | 값 |
|------|----|
| Hero padding | `140px 40px 200px` (top right-left bottom) |
| Hero 콘텐츠 max-width | 860 px (text-align: center) |
| `.sf-stack` max-width | 1100 px |
| `.video-frame-wrap` max-width | 1200 px |
| Nav 컨테이너 max-width | 1200 px (스크롤 시 100% + rounded pill) |
| Nav 높이 | 72 px → 58 px (스크롤 시 축소) |
| 반응형 분기점 | 600 px (모바일) · 768 px (좁은 태블릿) · 900 px (태블릿) |
| Hero 부제 max-width | 520 px |
| 섹션 부제 max-width | 560 px |

---

## 6. 모션

### 키프레임 / 트랜지션

- 페이지 진입: `@keyframes pageFadeIn` — `opacity 0→1, translateY(-12px→0)`, `0.5s cubic-bezier(0.16, 1, 0.3, 1)`
- Hero 단어 등장: `.hero-h1 .word` 각 0.15s 간격, `fadeUp .6s ease forwards`, delay 0.2 / 0.35 / 0.5 s
- Hero 부제 fade-up: delay 0.65 s
- Nav 변형: `padding .48s cubic-bezier(0.25, 0.46, 0.45, 0.94)` (랜딩) / `.24s cubic-bezier(0.22, 0.61, 0.36, 1)` (sub-page)
- Hero badge 점: 박동(`pulse 2s infinite`), 7×7 px 도트, 색 `#C4A8F5`

---

## 7. 핵심 패턴 (재사용 좋은 것)

### Section eyebrow (작은 라벨)

```css
font-size: 13px;
font-weight: 600;
color: var(--accent);
letter-spacing: 0.8px;
text-transform: uppercase;
margin-bottom: 14px;
```

### Section heading 묶음

```
eyebrow         (13px / 보라 / 대문자)
↓ 14px gap
section-h2      (42px / 700 / -1.5px)
↓ 16px gap
section-sub     (17px / 1.7 line-height / max-w 560)
```

### 카드 텍스트 묶음 (sf-card)

```
sf-label        (15px / 600 / muted)
sf-card-text h3 (28px / 700 / -1px / 1.22)
sf-card-text p  (14px / 1.7 / secondary)
feature item    (14px / 10px gap / 6 px 도트)
```

### 1차 CTA 큰 버튼 (`.btn-primary-lg`)

```css
font: 15px/700 Noto Sans KR;
color: #fff;
background: var(--accent);
padding: 14px 28px;
border-radius: var(--radius-md);          /* 12px */
box-shadow: 0 4px 16px rgba(196,168,245,0.3);

/* hover */
background: var(--accent-dark);
transform: translateY(-2px);
box-shadow: 0 8px 24px rgba(196,168,245,0.35);
```

### Outline 버튼 (다크 배경용)

```css
font: 15px/600;
color: #fff;
background: rgba(255,255,255,0.1);
border: 1.5px solid rgba(255,255,255,0.3);
padding: 13px 28px;
border-radius: var(--radius-md);
backdrop-filter: blur(8px);

/* hover */
border-color: var(--accent-mid);
background: var(--accent-light);
```

---

## 8. 동일 톤 적용 체크리스트 (sub-page / 외부 디자인 매칭용)

- [ ] 배경: `--bg` 흰색 또는 다크 hero (`#0a0614` ~ `--text-primary`) 둘 중 하나로 통일
- [ ] 액센트: `--accent (#C4A8F5)` 만 단일 액센트로 (gold / teal 같이 다른 hue 섞지 않기)
- [ ] 본문 폰트: `--font-ko` (Noto Sans KR), 영문/숫자만 `--font-en` (Plus Jakarta Sans)
- [ ] H2 크기 42 px 기준, `letter-spacing: -1.5px` 유지
- [ ] 1차 CTA 는 `--accent` 배경 + 보라 글로우 섀도우
- [ ] 모서리: 카드 12 px (`--radius-md`), 작은 컨트롤 8 px (`--radius-sm`)
- [ ] hover 모션: `translateY(-2px)` + 섀도우 증폭이 표준
