# Landing section illustrations

This folder holds the 4 neon-themed illustrations rendered next to
each card in the `온라인마케팅의 시작 AISEO.TIPS` section of the
landing page (`frontend/src/pages/LandingPage.tsx` →
`#scrollFeatures`).

## Required files

Save the 4 illustrations at these exact paths so the `<img>` tags
in `LandingPage.tsx` resolve:

| File                  | Card | Theme color | Subject                                              |
|-----------------------|------|-------------|------------------------------------------------------|
| `sf-card-0.webp`      | 0    | Violet      | 프롬프트 → 사이트 빌더 dashboard (AI 홈페이지 제작)  |
| `sf-card-1.webp`      | 1    | Green       | 글로브 + 웹사이트 + 클라우드 (도메인 & 호스팅)       |
| `sf-card-2.webp`      | 2    | Amber       | 적층 문서 + 분석 차트 (SEO 핵심강의)                 |
| `sf-card-3.webp`      | 3    | Orange      | 봇 + IG/Google/X (성과 분석 & 마케팅 자동화)         |

## Format notes

- `.webp` recommended (smallest size, browser support is universal
  for our target audience). PNG also works — just update the
  `<img src="…">` extension to match.
- Recommend ~1132 × 1422 source, served at whatever resolution; the
  CSS uses `object-fit: contain` so aspect ratio is preserved.
- These are dark-on-black neon illustrations — the card has a dark
  gradient background (`--card-bg1`/`--card-bg2`) to blend cleanly.

## How they're referenced

`frontend/src/pages/LandingPage.tsx` (search for `sf-card-photo`).
The CSS class is defined in `frontend/src/pages/landing.css` near
the `.sf-card-img` rule.
