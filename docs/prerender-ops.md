# Prerender 운영 가이드 — 배포 · 업로드 · 라이브 반영

AISEO 사이트의 **프리렌더 HTML 시스템**을 dev / prod 양쪽 환경에서
어떻게 배포·유지·롤백하는지 정리한 운영 문서입니다. 개발자가 바뀌어도
이 파일만 읽으면 배포 흐름을 완전히 재현할 수 있어야 합니다.

관련 소스 파일:

| 역할 | 경로 |
|---|---|
| 빌드타임 프리렌더 스크립트 | `frontend/scripts/prerender.mjs` |
| 런타임(블로그) 프리렌더 모듈 | `backend/functions/blog/prerender.js` |
| 블로그 Lambda 핸들러 | `backend/functions/blog/handler.js` |
| CDK (Lambda 권한/env) | `infra/cdk/lib/cdk-stack.ts` |
| CloudFront Function 소스 | `infra/cloudfront/subdomain-router.js` |
| CloudFront Function 수동 가이드 | `infra/cloudfront/README.md` |
| dev 배포 스크립트 | `scripts/deploy-dev.sh`, `scripts/deploy-dev.ps1` |

---

## 1. 프리렌더가 왜 필요한가

프런트엔드는 Vite 기반 React SPA 라 S3 가 실제로 서빙하는 HTML 은
`dist/index.html` 한 파일뿐입니다. 이 상태로는:

- **구글**: JS 를 실행해서 렌더링된 결과를 인덱싱 → ✅ 괜찮음
- **카카오 / 페이스북 / X (Twitter) / 네이버**: JS 를 실행하지 않고
  원본 HTML 만 읽음 → ❌ 공유 미리보기가 모든 페이지에서 동일한
  `AISEO — AI 웹사이트, 검색 노출까지 한 번에` 로 뜸

마케팅 관점에서는 치명적이므로, 소셜 크롤러가 페이지마다 다른 OG 태그를
받도록 **경로별로 정적 HTML 파일을 미리 만들어서 S3 에 올려둡니다**.
사람이 브라우저로 방문하면 같은 파일 안의 `<script>` 태그가 실행되면서
React SPA 가 마운트되므로, 클라이언트 경험은 동일합니다.

프리렌더는 두 가지 경로로 이루어집니다:

| 종류 | 시점 | 대상 | 생성 주체 |
|---|---|---|---|
| **빌드타임 (고정 페이지)** | `npm run build` 실행 시 | `/course2026`, `/support2026`, `/events2026`, `/blog` | `frontend/scripts/prerender.mjs` |
| **런타임 (블로그 포스트)** | 관리자가 포스트 저장 시 | `/blog/<slug>` 전부 | `backend/functions/blog/prerender.js` (Lambda) |

---

## 2. S3 키 구조 (양쪽 환경 공통)

```
s3://aiseo-sites-dev-bucket/     (dev)
s3://aiseo-sites-bucket/         (prod)
│
├── index.html                   ← dev.aiseo.tips / aiseo.tips 루트 (랜딩)
├── b2b.html, b2b/index.html     ← b2b 서브도메인
│
└── site/                        ← site.(dev.)aiseo.tips
    ├── index.html               ← SPA shell (fallback)
    ├── assets/                  ← Vite 빌드 JS/CSS
    │   ├── index-<hash>.js
    │   └── index-<hash>.css
    │
    ├── course2026/index.html    ← 프리렌더 (빌드타임)
    ├── support2026/index.html   ← 프리렌더 (빌드타임)
    ├── events2026/index.html    ← 프리렌더 (빌드타임)
    ├── blog/index.html          ← 프리렌더 (빌드타임) — 블로그 목록
    │
    └── blog/<slug>/index.html   ← 프리렌더 (런타임) — 개별 포스트
        └── …                    ← 블로그 Lambda 가 포스트 저장 시 write
```

**중요**: `site/blog/<slug>/index.html` 파일들은 백엔드 Lambda 가
**런타임에** DynamoDB 의 포스트 데이터로 만들어 쓰는 파일이므로,
프런트엔드 배포 중에 실수로 지우면 안 됩니다. 아래 §4 / §5 의
배포 절차가 이 규칙을 지키도록 설계되어 있습니다.

---

## 3. 환경 정보

### dev

| 항목 | 값 |
|---|---|
| S3 버킷 | `aiseo-sites-dev-bucket` |
| CloudFront distribution ID | `E2SBJ84WHHWIJM` |
| 루트 도메인 | `https://dev.aiseo.tips` |
| SPA 서브도메인 | `https://site.dev.aiseo.tips` |
| AWS 프로필 | `aiseo` |

### prod

| 항목 | 값 |
|---|---|
| S3 버킷 | `aiseo-sites-bucket` |
| CloudFront distribution ID | `EZSNEM80TUP6K` |
| 루트 도메인 | `https://aiseo.tips` |
| SPA 서브도메인 | `https://site.aiseo.tips` |
| AWS 프로필 | `aiseo` |

> 두 distribution 은 **같은 CloudFront Function 인스턴스**
> (`subdomain-router`) 를 공유하고 있어, 함수 publish 한 번으로 양쪽에
> 즉시 반영됩니다. 별도 copy 나 associate 단계는 없습니다.

---

## 4. 배포 흐름 — dev 환경

### 정상 배포 (프런트엔드만 변경된 경우)

```bash
cd /path/to/aiseo
bash scripts/deploy-dev.sh
```

(Windows PowerShell: `.\scripts\deploy-dev.ps1`)

스크립트가 하는 일:

1. `cd frontend && npm run build`
   - `tsc -b`
   - `vite build` → `frontend/dist/` 생성
   - `node scripts/prerender.mjs` → 고정 페이지 프리렌더
2. `aws s3 cp dist/philo-main.html s3://…/index.html` — 루트 랜딩
3. `aws s3 cp dist/b2b.html s3://…/b2b.html` + `b2b/index.html`
4. **`aws s3 sync dist/ s3://…/site/ --exclude philo-main.html --exclude b2b.html`**
   - SPA shell (`index.html`), `assets/`, 그리고 프리렌더 서브디렉토리
     (`course2026/`, `support2026/`, `events2026/`, `blog/`) 모두 업로드
   - **`--delete` 가 빠져 있음** — 이게 핵심. 있으면 백엔드가 쓴
     `site/blog/<slug>/index.html` 파일들이 싹 지워집니다.
5. `aws cloudfront create-invalidation --paths "/*"` — 전체 캐시 무효화

### 백엔드(블로그 Lambda) 도 같이 변경됐을 때

`backend/functions/blog/` 또는 `infra/cdk/lib/cdk-stack.ts` 가
바뀌었다면 CDK 배포를 **먼저** 해야 합니다:

```bash
cd infra/cdk
npm install             # 처음이면
npx cdk deploy          # aiseo 프로필/리전은 cdk.json 에 설정됨
cd ../..
bash scripts/deploy-dev.sh
```

CDK 가 새 Lambda 코드를 올리고 env vars / IAM 권한을 최신화한 뒤,
프런트엔드 sync 가 프리렌더 HTML 을 덮어씁니다.

### CloudFront Function 도 변경됐을 때

`infra/cloudfront/subdomain-router.js` 가 커밋에 포함됐다면:

1. 위 정상 배포 먼저 실행 (S3 에 새 프리렌더 파일 올라가 있어야 함).
2. **CloudFront 콘솔 → Functions → `subdomain-router` → Build 탭에
   붙여넣기 → Test → Publish.**
3. 자세한 단계·테스트 케이스·롤백 절차는
   **`infra/cloudfront/README.md`** 에 정리돼 있음.

### 검증

```bash
curl -sI https://site.dev.aiseo.tips/course2026 | grep -i 'x-cache\|content-type'
curl -s  https://site.dev.aiseo.tips/course2026 | grep -oE '<title>[^<]*</title>'
# 기대: <title>수강안내 2026 | AISEO</title>
```

블로그 포스트 하나 만든 뒤:

```bash
curl -s  https://site.dev.aiseo.tips/blog/<slug> | grep -oE '<meta property="og:title"[^>]*>'
```

---

## 5. 배포 흐름 — prod 환경

```bash
# Bash
bash scripts/deploy-prod.sh

# PowerShell
.\scripts\deploy-prod.ps1
```

스크립트가 자동으로 수행하는 작업:

1. `VITE_APP_ENV=prod PRERENDER_BASE_URL=https://site.aiseo.tips` 로
   프론트엔드 빌드 (API 엔드포인트 + canonical URL 을 prod 으로 설정)
2. 랜딩/B2B/SPA+프리렌더 HTML 을 `s3://aiseo-sites-bucket` 에 업로드
3. CloudFront 캐시 무효화 (distribution `EZSNEM80TUP6K`)

> 실수 방지를 위해 실행 시 `deploy-prod` 를 입력해야 진행됩니다.

### 수동 배포 (참고용)

스크립트 대신 수동으로 실행해야 할 경우:

```bash
# 0. 빌드 (PRERENDER_BASE_URL 을 prod 로 오버라이드)
cd frontend
VITE_APP_ENV=prod PRERENDER_BASE_URL=https://site.aiseo.tips npm run build
cd ..

# 1. 랜딩
aws s3 cp frontend/dist/philo-main.html s3://aiseo-sites-bucket/index.html \
  --content-type "text/html; charset=utf-8" --profile aiseo

# 2. B2B
aws s3 cp frontend/dist/b2b.html s3://aiseo-sites-bucket/b2b.html \
  --content-type "text/html; charset=utf-8" --profile aiseo
aws s3 cp frontend/dist/b2b.html s3://aiseo-sites-bucket/b2b/index.html \
  --content-type "text/html; charset=utf-8" --profile aiseo

# 3. SPA + 프리렌더 서브디렉토리
#    ⚠ --delete 절대 붙이지 말 것 (site/blog/<slug>/index.html 삭제 방지)
aws s3 sync frontend/dist/ s3://aiseo-sites-bucket/site/ \
  --exclude "philo-main.html" \
  --exclude "b2b.html" \
  --profile aiseo

# 4. CloudFront 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id EZSNEM80TUP6K \
  --paths "/*" \
  --profile aiseo
```

### prod 에서 `PRERENDER_BASE_URL` 을 꼭 지정해야 하는 이유

`frontend/scripts/prerender.mjs` 의 기본값은
`https://site.dev.aiseo.tips` 입니다. 이 값이 프리렌더된 HTML 의
`<link rel="canonical">` 과 `og:url` 에 그대로 박히므로, prod 빌드 시에는
반드시 `PRERENDER_BASE_URL=https://site.aiseo.tips` 로 오버라이드해야
소셜 크롤러가 올바른 prod URL 을 파싱합니다.

> dev 배포 스크립트는 이 값을 별도로 주지 않으므로 기본값이 그대로
> 쓰입니다. `scripts/deploy-prod.sh` 는 빌드 커맨드 앞에
> `VITE_APP_ENV=prod PRERENDER_BASE_URL=https://site.aiseo.tips` 를
> 인라인으로 주입합니다.

### 블로그 Lambda 의 prod 환경변수

블로그 Lambda 는 **단일 인스턴스**로 dev + prod 양쪽 버킷에 동시에
prerender 를 씁니다 (`backend/functions/blog/prerender.js` 참고). 따라서
CDK 배포 시 아래 env vars 가 모두 세팅돼야 합니다:

```dotenv
SITES_BUCKET=aiseo-sites-bucket
SITES_BUCKET_DEV=aiseo-sites-dev-bucket
DISTRIBUTION_ID=EZSNEM80TUP6K
DISTRIBUTION_ID_DEV=E2SBJ84WHHWIJM
BLOG_BASE_URL=https://site.aiseo.tips   # 또는 dev 주소. prod 배포 시 변경
```

`BLOG_BASE_URL` 하나만 OG 태그의 canonical 에 영향을 줍니다. **이게
dev 주소로 박혀 있으면 prod 에서 포스트를 저장해도 소셜 카드에는
`site.dev.aiseo.tips/blog/…` 링크가 뜹니다.** 배포 환경을 바꿀 때 꼭
확인하세요.

---

## 6. 고정 페이지 추가하기 (예: `/pricing2026`)

### Step 1 — React 페이지 생성

`frontend/src/pages/public/Pricing2026Page.tsx` (기존
`Course2026Page.tsx` 를 복사해서 문구만 교체):

```tsx
import { ComingSoon2026 } from './ComingSoon2026';

export function Pricing2026Page() {
  return (
    <ComingSoon2026
      activeMenu="pricing"     // Nav2026Key 에 'pricing' 추가 필요
      eyebrow="PRICING 2026"
      title="요금제"
      docTitle="요금제 2026 | AISEO"
      metaDescription="AISEO 2026 요금제…"
      canonicalPath="/pricing2026"
    />
  );
}
```

### Step 2 — 라우터 등록

`frontend/src/App.tsx` 의 게스트 라우트 블록에 추가:

```tsx
<Route path="/pricing2026" element={<Pricing2026Page />} />
```

### Step 3 — 빌드타임 프리렌더 등록

`frontend/scripts/prerender.mjs` 의 `ROUTES` 배열에 추가:

```js
{
  path: '/pricing2026',
  title: '요금제 2026 | AISEO',
  description: 'AISEO 2026 요금제…',
},
```

### Step 4 — CloudFront Function 라우팅 등록

`infra/cloudfront/subdomain-router.js` 의 `PRERENDERED_FIXED` 맵에
추가:

```js
'/pricing2026': '/site/pricing2026/index.html',
```

### Step 5 — 배포 + 함수 publish

```bash
bash scripts/deploy-dev.sh
```

그 다음 **반드시** CloudFront 콘솔에서 함수 republish
(`infra/cloudfront/README.md` 참고). 안 하면 `/pricing2026` 은
`/site/index.html` 로 떨어져서 소셜 카드가 동작하지 않습니다.

### Step 6 — 검증

```bash
curl -s https://site.dev.aiseo.tips/pricing2026 | grep -oE '<title>[^<]*</title>'
# <title>요금제 2026 | AISEO</title>
```

---

## 7. 블로그 포스트 관리

블로그 포스트의 프리렌더 HTML 은 **관리자 UI에서 포스트를 저장할
때마다 자동으로 생성·갱신·삭제됩니다**. 수동 조작은 불필요합니다.

동작 요약 (`backend/functions/blog/handler.js`):

| 관리자 액션 | Lambda 동작 |
|---|---|
| **Create** (`published`) | DynamoDB put → `prerenderPost(item)` → S3 write + CF invalidate |
| **Create** (`draft`) | DynamoDB put → `prerenderPost` 호출되지만 `status !== published` 이므로 `deletePrerenderedPost` 로 정리 |
| **Update** (slug 그대로) | DynamoDB put → `prerenderPost` (published 아니면 delete) |
| **Update** (slug 변경) | new slug put + old slug delete → `deletePrerenderedPost(oldSlug)` → `prerenderPost(newItem)` |
| **Delete** (soft) | status→deleted → `deletePrerenderedPost(slug)` |

### 직접 확인이 필요한 상황

- **Lambda 로그**: CloudWatch Logs → `/aws/lambda/<BlogFunction>`
  검색. 로그 prefix `[prerender]` 로 성공/실패가 남음.
- **S3 오브젝트 존재 확인**:
  ```bash
  aws s3 ls s3://aiseo-sites-dev-bucket/site/blog/ --profile aiseo
  ```
- **수동 invalidation** (캐시가 이상할 때만):
  ```bash
  aws cloudfront create-invalidation \
    --distribution-id E2SBJ84WHHWIJM \
    --paths "/blog/<slug>" "/blog/<slug>/" \
    --profile aiseo
  ```

### 대량 재생성 (예: 템플릿 스타일이 바뀐 경우)

현재는 **전용 재빌드 스크립트가 없습니다**. 필요해지면 옵션:

1. **가장 단순**: 관리자 UI에서 각 포스트를 열어 Save 한 번씩 눌러
   다시 저장. 모든 포스트를 갱신하지만 수작업.
2. **스크립트**: DynamoDB 의 모든 `published` 포스트를 scan 해서 한
   번에 `PutCommand` 를 돌리는 Node 스크립트를 일회성으로 작성.
   `adminUpdatePost` 의 프리렌더 호출 경로를 재사용하면 끝.
3. **Lambda trigger**: 콘솔에서 `BlogFunction` 을 직접 Invoke 해서
   `{resource:'/admin/blog/posts/{slug}', httpMethod:'PUT', …}` 이벤트를
   던지는 방식. 운영 편의상은 떨어짐.

운영 중 자주 필요해지면 3번 또는 별도 `rebuild-blog-prerender.js`
스크립트를 추가하는 것을 권장합니다.

---

## 8. 트러블슈팅 체크리스트

### "공유했더니 옛날 OG 태그가 뜬다"

1. 실제 S3 에 파일이 있는지 확인:
   ```bash
   aws s3 ls s3://aiseo-sites-dev-bucket/site/course2026/ --profile aiseo
   ```
2. 파일 내용의 `<title>` 이 맞는지:
   ```bash
   aws s3 cp s3://aiseo-sites-dev-bucket/site/course2026/index.html - --profile aiseo | grep title
   ```
3. CloudFront 캐시 무효화를 깜박한 경우:
   ```bash
   aws cloudfront create-invalidation --distribution-id E2SBJ84WHHWIJM \
     --paths "/course2026" --profile aiseo
   ```
4. **소셜 플랫폼 캐시** — 각 플랫폼이 자체적으로 OG 카드를 몇 시간~
   며칠 캐싱합니다:
   - 페이스북: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
     에서 URL 입력 → **Scrape Again**
   - 카카오: 카카오톡 자체 캐시는 지우기 힘듦. 쿼리스트링 (`?v=2`) 을
     붙인 URL 로 공유하면 새로 크롤됨
   - X (Twitter): [Card validator](https://cards-dev.twitter.com/validator)
     이전에 있었으나 현재는 탐색 제한. 쿼리스트링 우회 권장
   - 네이버: 블로그/카페 경로는 네이버 자체 재크롤 주기(수시간)를 기다림

### "CloudFront Function 고쳤는데 반영 안 됨"

- Publish 를 눌렀는지 확인 (Save 만 눌렀으면 live 아님)
- Publish 직후 반영까지 수십 초 걸릴 수 있음
- 직전 버전이 캐시돼서 헷갈리면 `/*` invalidation 한 번

### "dev 에 배포했는데 `site/blog/<slug>/index.html` 이 사라짐"

- 범인은 **`aws s3 sync` 에 `--delete` 를 추가했기 때문**.
  `scripts/deploy-dev.sh` 에서 해당 플래그를 제거하세요. 기본 상태는
  `--delete` 가 없어야 맞음.
- 복구는 admin UI 에서 해당 포스트를 열고 Save 만 누르면 Lambda 가
  다시 프리렌더를 씁니다.

### "빌드는 통과하는데 prerender 파일이 안 생김"

- `npm run build` 로그에서 `[prerender]` 줄이 보이는지 확인.
- 안 보이면 `package.json` 의 build 스크립트가 옛날 버전 (`tsc && vite
  build` 만 있는 상태) 인지 확인하고 `&& node scripts/prerender.mjs`
  를 추가.

---

## 9. 기억할 것 세 가지

1. **`--delete` 금지** — `s3 sync frontend/dist/ s3://…/site/` 에 절대
   `--delete` 를 붙이지 마세요. 블로그 포스트 프리렌더가 전부 지워집니다.
2. **`PRERENDER_BASE_URL` 과 `BLOG_BASE_URL` 은 짝** — 빌드타임/런타임
   양쪽에서 같은 origin 을 가리키도록 맞추세요. 한쪽만 dev 로 박혀
   있으면 소셜 카드가 엉뚱한 도메인을 가리킵니다.
3. **CloudFront Function publish 는 수동** — 라우팅 규칙이 바뀌었다면
   반드시 콘솔에서 republish 해야 실제 트래픽에 반영됩니다. `cdk
   deploy` 가 대신 해주지 않습니다. 자세한 절차는
   `infra/cloudfront/README.md`.
