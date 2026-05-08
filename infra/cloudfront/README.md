# CloudFront Function — 수동 업데이트 가이드

`subdomain-router.js` 는 CloudFront Viewer-Request Function 의 **소스
코드**이고, 실제로 트래픽을 받는 건 CloudFront 콘솔에 저장된 함수의
Live 버전입니다. **이 저장소의 파일을 수정했다면 반드시 아래 절차로
콘솔의 함수를 같이 업데이트**해야 프로덕션 동작이 바뀝니다.

> CDK 스택이 이 함수를 관리하지 않는 이유: 함수는 배포 초기에 수동으로
> 생성되었고, CDK 로 import 해오면 기존 distribution 과의 연결이
> 깨지기 때문에 소스 코드만 리포지토리에 남기고 publish 는 수동으로
> 유지하는 방식을 택했습니다.

## 언제 업데이트해야 하나

아래 중 **하나라도** 바뀌면 콘솔에서 다시 publish 해야 합니다:

1. `infra/cloudfront/subdomain-router.js` 의 내용 자체 변경
2. 새로운 prerendered 정적 페이지 추가
   (= `frontend/scripts/prerender.mjs` 의 `ROUTES` 에 항목 추가)
3. 새로운 서브도메인 매핑 규칙 (dev/prod 양쪽 모두)
4. 블로그 slug 형식 변경 (현재 `[a-z0-9-]+`)

## 업데이트 절차 (AWS 콘솔)

1. **AWS 콘솔 로그인** → `ap-northeast-2` 는 CloudFront Function 과
   무관합니다. CloudFront 는 글로벌 서비스이므로 리전 선택 없이 진행.

2. 상단 검색창에 **CloudFront** → 왼쪽 사이드바 **Functions** 클릭.

3. 함수 목록에서 `subdomain-router` (이름은 배포 당시 지정했던 것)
   를 클릭합니다. 찾지 못하면 dev/prod 두 distribution 의 Behaviors
   → Function associations 에서 viewer-request 에 연결된 함수 이름을
   확인하세요.

4. **Build** 탭 → 오른쪽 코드 편집기. 기존 코드를 전부 지우고
   `infra/cloudfront/subdomain-router.js` 의 **내용 전체**를 복사해서
   붙여넣기.

   > 주의 — 주석도 그대로 붙여넣어도 괜찮지만, CloudFront Function
   > 런타임은 ES5 기반이므로 `const`, `let`, arrow function, template
   > literal, spread 등은 사용할 수 없습니다. 저장소의 파일은 이미
   > ES5 스타일로 작성되어 있으니 그대로 붙여넣으면 됩니다.

5. **Save changes** 버튼 클릭 → 편집 버전이 저장됩니다 (아직 라이브
   아님).

6. **Test** 탭으로 이동해서 최소 아래 4가지 케이스를 확인:

   | URI                        | Host header            | 기대 결과                                   |
   |----------------------------|------------------------|--------------------------------------------|
   | `/course2026`              | `site.dev.aiseo.tips`  | `request.uri = /site/course2026/index.html` |
   | `/blog/hello-world`        | `site.dev.aiseo.tips`  | `request.uri = /site/blog/hello-world/index.html` |
   | `/assets/index-abc123.js`  | `site.dev.aiseo.tips`  | `request.uri = /site/assets/index-abc123.js` |
   | `/unknown-route`           | `site.dev.aiseo.tips`  | `request.uri = /site/index.html` (SPA fallback) |

   각 케이스마다 **Test function** 클릭 → 출력 JSON 에서 `uri` 필드가
   기대값과 일치하는지 확인합니다. 하나라도 다르면 코드를 다시 점검
   하세요 (대개는 regex 오타 또는 라우트 맵 오타).

7. 테스트가 모두 통과하면 **Publish** 탭 → **Publish function** 버튼.
   라이브 버전이 교체되고, 기존에 연결된 모든 distribution 에 즉시
   (수십 초 내) 반영됩니다. 별도 Associate 단계는 필요 없습니다.

8. **검증** — prod/dev distribution 양쪽에 반영됐는지 실제 URL 로 확인:

   ```bash
   curl -sI https://site.dev.aiseo.tips/course2026 | head -5
   curl -s  https://site.dev.aiseo.tips/course2026 | grep -o '<title>[^<]*</title>'
   ```

   두 번째 명령의 출력이 `<title>수강안내 2026 | AISEO</title>` 이면
   성공. 만약 기본 `<title>AISEO — AI 웹사이트...</title>` 이 나오면
   프리렌더 파일이 S3 에 없거나 CloudFront 캐시가 오래된 겁니다.
   전자는 `npm run build && scripts/deploy-dev.sh`, 후자는 CloudFront
   콘솔에서 `/course2026` 경로 invalidation.

## 새로운 prerendered 서브페이지 추가하기

예: `/pricing2026` 을 새로 만든다고 할 때:

1. `frontend/src/pages/public/Pricing2026Page.tsx` 생성 (기존
   `Course2026Page.tsx` 복사 후 텍스트만 교체).
2. `frontend/src/App.tsx` 의 `<Routes>` 에 `<Route path="/pricing2026"
   element={<Pricing2026Page />} />` 추가.
3. `frontend/scripts/prerender.mjs` 의 `ROUTES` 배열에 항목 추가:
   ```js
   {
     path: '/pricing2026',
     title: '요금제 2026 | AISEO',
     description: '…',
   },
   ```
4. `infra/cloudfront/subdomain-router.js` 의 `PRERENDERED_FIXED` 맵에
   같은 항목 추가:
   ```js
   '/pricing2026': '/site/pricing2026/index.html',
   ```
5. `scripts/deploy-dev.sh` (또는 PowerShell 버전) 실행 → 새 HTML 이
   S3 에 업로드됩니다.
6. 위 "업데이트 절차" 대로 CloudFront Function publish.

## 블로그 포스트와의 관계

블로그 포스트는 **콘솔 업데이트가 필요 없습니다**. 현재 함수는
`/blog/<slug>` 패턴을 이미 regex 로 매칭하도록 되어 있고, 실제 HTML
파일은 블로그 Lambda (`backend/functions/blog/prerender.js`) 가 포스트
저장 시점에 S3 에 직접 쓰기 때문입니다.

유일한 예외: slug 형식이 현재의 `[a-z0-9-]+` 에서 벗어나게 바뀌는
경우. 예를 들어 밑줄 `_` 을 허용하게 되면 regex 를 업데이트하고 함수도
다시 publish 해야 합니다.

## prod distribution 에 함수가 attach 됐는지 확인

> **증상 — 사용자 사이트가 흰화면 + `Refused to apply style ... MIME
> type ('text/html')` 콘솔 에러:** 거의 100% prod CloudFront
> distribution (`EZSNEM80TUP6K`) 에 `subdomain-router` 가 attach
> 되어 있지 않거나, `*.aiseo.tips` 서브도메인 라우팅 추가 이전의
> 구버전이 publish 되어 있어서 `real.aiseo.tips/assets/*.css` →
> `/real/assets/*.css` 로 리라이트되지 못하고 S3 가 404 → CF 기본
> 에러 페이지(`text/html`)가 응답되는 케이스.

dev 에선 잘 되는데 prod 만 깨진다면 아래 순서로 확인:

1. AWS 콘솔 → CloudFront → Distributions → `EZSNEM80TUP6K`
   (aiseo-sites) 클릭 → **Behaviors** 탭 → Default behavior 선택
   → **Function associations** 섹션에 `viewer-request` 가
   `subdomain-router` 로 채워져 있는지 확인.
2. 비어 있다면 **Edit** → Function type: CloudFront Functions,
   Function ARN: `subdomain-router` 선택 → **Save changes**.
3. 같은 화면에서 dev distribution (aiseo-sites-dev) 와 비교해서
   동일한 함수 이름이 양쪽에 붙어 있는지 확인.
4. CLI 로 한 번에 확인하려면:

   ```bash
   aws cloudfront get-distribution-config --id EZSNEM80TUP6K \
     --profile aiseo \
     --query 'DistributionConfig.DefaultCacheBehavior.FunctionAssociations'
   ```

   결과의 `Items[].FunctionARN` 이 `subdomain-router` 를 가리키지
   않으면 1–2 단계 적용.
5. 적용 후 라이브 검증:

   ```bash
   curl -sI https://<test-siteId>.aiseo.tips/ | head -5
   curl -sI https://<test-siteId>.aiseo.tips/assets/index-<hash>.css | head -5
   ```

   두 번째 요청의 `content-type` 헤더가 `text/css; charset=utf-8`
   여야 함. `text/html` 이면 (a) S3 에 키가 없거나 (b) 함수가 여전히
   라우팅하지 않음. CloudWatch Logs 에서 Lambda `DeploySite` 의
   `deploy-complete` 로그를 보고 `hasIndexHtml`/`hasAssetsDir` 이
   둘 다 `true` 인지 확인.

## 롤백

배포된 함수가 잘못 동작할 때:

1. CloudFront Functions → 해당 함수 → **Publish** 탭.
2. 하단에 이전 버전 목록 (ETag + 게시 시각) 이 있음.
3. 직전 ETag 에서 **Copy** → **Build** 탭 붙여넣기 → **Save** →
   **Publish** 로 복원합니다.

그게 불안하면 `git log infra/cloudfront/subdomain-router.js` 로
이전 커밋의 파일 내용을 확인해서 같은 방식으로 publish 하면 됩니다.
