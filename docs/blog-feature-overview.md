# 블로그 기능 구축 — 개요

> `site.dev.aiseo.tips` 공개 블로그 기능 구축을 위한 대략적 설계 개요.
> 페이즈별 상세 구현은 별도 문서로 분리 예정.

## Context

`site.dev.aiseo.tips` 메인 하단에 현재 목업으로만 존재하는 블로그 섹션
(`frontend/src/pages/LandingPage.tsx:1151-1210`) 을 실제 블로그로 교체.
네비게이션에 이미 있는 `/#blog` 링크 (`PublicSubPage.tsx:49,67`) 는 현재
"준비중" 플레이스홀더이며, 이를 실제 목록/상세 페이지로 연결.

요구사항:

- 비회원이 읽는 공개 블로그
- 어드민만 발행 가능한 CMS
- 카테고리 + 태그 필터
- 메인 페이지 featured 4개 (별도 지정)
- SEO 최적화 — slug, OG, 메타태그, 실제 경로 URL

## 결정 요약

| 항목 | 결정 |
|---|---|
| 본문 편집 방식 | **Markdown** (`react-markdown` + `remark-gfm`) |
| URL 구조 | **실제 경로** `/blog` 목록, `/blog/<slug>` 상세 (해시 아님) |
| SPA fallback | 이미 있음 (`infra/cloudfront/subdomain-router.js:24-34` — extensionless path → `/site/index.html`) |
| 발행 상태 | `draft` / `published` / `deleted` (soft delete) + `publishedAt` |
| 예약 발행 | `publishedAt > now` 필터로 처리 (별도 cron 불필요) |
| Draft 미리보기 | 어드민 에디터 프리뷰에서만 (공개 URL 없음) |
| Slug 변경 | 발행 후 변경 허용, 구 slug 는 404 (리다이렉트 없음) |
| SEO 메타 | 본문과 별개로 `metaTitle`, `metaDescription`, `ogImage` **별도 필드** |
| 썸네일 | 카드 썸네일과 OG 이미지 **별도 필드** |
| 목록 페이지네이션 | **30개/페이지 + 클래식 페이지 번호 네비게이션** |
| 본문 저장 | **DynamoDB inline** (아래 "본문 저장 검토" 참고) |
| 카테고리 | 글당 1개, 어드민이 순서 지정 |
| 태그 | 다중 태그 가능 |
| 상세 하단 | 조회수 상위 3개 글 |
| Slug 규칙 | `/^[a-z0-9-]+$/` (필수, 유일) |
| 메인 featured 4개 | 글에 `featured: boolean` + `featuredOrder: number` 플래그 |
| 어드민 인증 | 기존 Cognito admin 그룹 재사용 |
| 이미지 업로드 | 기존 `image-upload-handler` 재사용 (`siteId: 'blog'`) |
| 조회수 | 상세 진입 시 DynamoDB `ADD` 원자적 증가 |

### 본문 저장 검토 (inline vs S3)

**결론: 현재 규모에서는 inline 이 더 낫다.**

- DynamoDB 아이템 최대 400KB → 마크다운 본문 10–50KB 가 일반적이므로 충분.
- 글 200개 미만 예상 → 목록 scan 도 1MB 이하, RCU 비용 무시 가능.
- inline 장점: 단일 진실 소스, 원자적 업데이트, 백업 단순, 코드 단순,
  S3 권한·consistency 이슈 없음.
- S3 분리 대안이 필요해지는 시점:
  - 본문이 400KB 넘는 경우 (거의 없음)
  - 글 수 수천 개 이상 + list scan 비용 부담
  - 본문 버전 히스토리가 필요한 경우 (S3 versioning 이용)
- **나중에 필요해지면** body 필드만 S3 로 빼는 마이그레이션이 단순해서
  현재는 inline 으로 시작.

## 작업 순서 (High-Level)

**방향: 백엔드 → 어드민 → 공개 → 메인 교체 → 배포**

### Phase 1 — 백엔드 인프라 (CDK)
DynamoDB 테이블 2개 (`aiseo-blog-posts`, `aiseo-blog-categories`) + Lambda
(`BlogFunction`) + APIGW 라우트 (공개 5개 + 어드민 7개) 를
`infra/cdk/lib/cdk-stack.ts` 에 등록.

### Phase 2 — 백엔드 핸들러 구현
`backend/functions/blog/handler.js` 단일 핸들러로 method + path 분기:

- **공개**: list (카테고리·태그 필터 + 페이지네이션), detail (+ viewCount 증가),
  featured, popular, categories
- **어드민**: posts CRUD (soft delete), categories CRUD
- 공개 list/detail 에서 `status='published' AND publishedAt <= now()` 필터로
  예약 발행 자동 처리, `status='deleted'` 는 공개에서 배제.

### Phase 3 — 프런트 공통 기반
- `npm i react-markdown remark-gfm react-helmet-async`
- `App.tsx` 비인증 브랜치를 `BrowserRouter` + `HelmetProvider` 로 래핑
  (기존 `#course` 등 해시 라우팅과 공존 — BrowserRouter 는 path 만 가로채고
  기존 hash listener 가 fragment 처리)
- `api.ts` 에 블로그 API 클라이언트 메서드 일괄 추가
- `index.html` 에 기본 OG 태그 추가 (Helmet 이 페이지별로 override)

### Phase 4 — 어드민 UI
컨텐츠가 있어야 공개 UI 테스트 가능 → 어드민 먼저 구현.

- `BlogCategoriesAdminPage.tsx` — 카테고리 추가·수정·삭제·순서 변경
- `BlogPostsAdminPage.tsx` — 글 목록 (draft/published/deleted 필터, 상태 토글,
  featured 체크)
- `BlogPostEditPage.tsx` — 마크다운 에디터 (textarea + 실시간 프리뷰) +
  모든 메타 필드 + 썸네일·OG 이미지 업로드 + 카테고리 드롭다운 + 태그 칩
  입력 + 발행일 피커

### Phase 5 — 공개 목록 페이지
`/blog` 경로. 캡쳐 레이아웃 (좌측 카테고리·태그 사이드바 + 우측 카드 그리드
+ 상단 featured 큰 카드). 30개/페이지 + 페이지 번호 네비게이션. 필터 상태는
URL 쿼리 (`?category=foo&tag=bar&page=2`).

### Phase 6 — 공개 상세 페이지
`/blog/<slug>` 경로. 마크다운 렌더 (GFM 지원) + 상단 메타 (제목, 카테고리,
태그, 발행일, 썸네일) + 하단 인기 3개 글. `<Helmet>` 으로 title, meta
description, OG 태그 동적 주입. 페이지 진입 시 viewCount +1 호출.

### Phase 7 — LandingPage 메인 블로그 섹션 교체
기존 목업 (`LandingPage.tsx:1151-1210`) 삭제 후 `GET /blog/featured` 호출
결과 4개를 카드로 렌더. "더 보기" → `/blog` 링크.

### Phase 8 — 배포 + E2E 검증
- CDK deploy → 프런트 build + deploy
- 어드민으로 카테고리 3–4개 생성
- 글 2–3개 작성 (1개 featured, 1개 예약 발행, 1개 즉시 발행)
- `/blog`, `/blog/<slug>`, 메인 featured 섹션, 조회수 증가, 필터,
  페이지네이션, OG 태그 (Facebook 디버거) 검증
- 커밋 분할 (phase 단위) + 푸시

## 파일·디렉토리 맵

**신규 생성**

```
backend/functions/blog/handler.js                       (Phase 2)
frontend/src/pages/public/BlogListPage.tsx              (Phase 5)
frontend/src/pages/public/BlogDetailPage.tsx            (Phase 6)
frontend/src/pages/admin/BlogCategoriesAdminPage.tsx    (Phase 4)
frontend/src/pages/admin/BlogPostsAdminPage.tsx         (Phase 4)
frontend/src/pages/admin/BlogPostEditPage.tsx           (Phase 4)
```

**수정**

```
infra/cdk/lib/cdk-stack.ts                  (Phase 1 — 블록 3개 추가)
frontend/package.json                       (Phase 3 — 의존성 3개)
frontend/src/App.tsx                        (Phase 3 — BrowserRouter 래핑, 7 라우트 추가)
frontend/src/api.ts                         (Phase 3 — 블로그 API 메서드 추가)
frontend/src/pages/LandingPage.tsx          (Phase 7 — blog 섹션 교체)
frontend/src/pages/landing.css              (Phase 7 — blog 섹션 CSS 갱신/삭제)
frontend/src/pages/public/PublicSubPage.tsx (Phase 5 — `#blog` 해시 → `/blog` 리다이렉트)
frontend/index.html                         (Phase 3 — 기본 OG 태그 추가)
```

**재사용 (변경 없음)**

```
backend/functions/shared/response.js
backend/functions/shared/auth.js
backend/functions/image-upload-handler/handler.js    (siteId='blog' 으로 호출)
```

## 데이터 스키마 (개요)

### `aiseo-blog-posts` (PK: `slug`)

```
slug            : PK, string, /^[a-z0-9-]+$/
title           : string
excerpt         : string (카드·OG 설명 겸용 fallback)
body            : string (markdown, inline)
category        : string (category slug 참조)
tags            : string[]
thumbnailUrl    : string (카드 썸네일)
ogImageUrl      : string (OG·트위터 카드 이미지)
metaTitle       : string (비면 title 사용)
metaDescription : string (비면 excerpt 사용)
status          : 'draft' | 'published' | 'deleted'
publishedAt     : ISO string (예약 발행 시 미래 시각)
createdAt       : ISO string
updatedAt       : ISO string
featured        : boolean
featuredOrder   : number (낮을수록 상단)
viewCount       : number
author          : 'AISEO' (고정)
```

### `aiseo-blog-categories` (PK: `slug`)

```
slug       : PK, string, /^[a-z0-9-]+$/
name       : string (표시명)
order      : number (사이드바 정렬용, 낮을수록 상단)
createdAt  : ISO string
```

## API 엔드포인트

### 공개 (auth NONE)

```
GET /blog/posts?category=&tag=&page=   → 목록 (30/page), 카테고리·태그 필터
GET /blog/posts/{slug}                 → 상세 + viewCount +1
GET /blog/featured                     → featured 플래그 + 정렬 4개
GET /blog/popular                      → viewCount desc 상위 3개
GET /blog/categories                   → 카테고리 목록
```

### 어드민 (Cognito admin)

```
GET    /admin/blog/posts                → 전체 글 목록 (draft/deleted 포함)
GET    /admin/blog/posts/{slug}         → 상세 (viewCount 미증가)
POST   /admin/blog/posts                → 신규 작성
PUT    /admin/blog/posts/{slug}         → 수정 (slug 변경 시 삭제 + 생성)
DELETE /admin/blog/posts/{slug}         → soft delete (status='deleted')
GET    /admin/blog/categories           → 전체 카테고리
POST   /admin/blog/categories           → 생성
PUT    /admin/blog/categories/{slug}    → 수정
DELETE /admin/blog/categories/{slug}    → 삭제
```

## 영향 범위 요약

- **다른 페이지 영향 없음**: 기존 `CoursePage`, 인증 대시보드는 건드리지 않음.
- **LandingPage**: blog 섹션만 교체.
- **CloudFront**: 변경 없음 (SPA fallback 이미 구성됨).
- **DynamoDB**: 신규 테이블 2개 (기존 테이블 영향 없음).
- **Lambda**: 신규 함수 1개.
- **APIGW**: 신규 리소스 트리 (`/blog/*`, `/admin/blog/*`).
