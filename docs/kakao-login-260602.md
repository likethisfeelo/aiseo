# 카카오 로그인 ↔ Cognito 통합 가이드 — 260602

> 작성: 2026-06-02
> 대상: 현재 site.aiseo.tips / aiseo.tips 의 Cognito User Pool 에 카카오 소셜 로그인 추가
> 전제: `docs/membership-260602.md` 의 그룹 모델 확정 상태 (post-confirmation Lambda 가 community 자동 부여 중)
> 용도: 결정·설정·코드 변경의 단일 출처

---

## 1 · 결론부터 — 어느 방식을 쓸지

세 가지 통합 방식이 있고, **`A — OIDC Federation (권장)`** 으로 가는 게 가장 깔끔함.

| 방식 | 장점 | 단점 | 추천도 |
|---|---|---|---|
| **A. OIDC Federation** (Cognito Hosted UI 가 카카오를 IdP 로 호출) | 코드 거의 없음 (콘솔 설정 위주), Cognito 가 토큰·세션·attribute mapping 모두 처리, 기존 post-confirmation Lambda 가 자동 호출됨 | Hosted UI URL 사용 (현재 직접 InitiateAuth 호출 구조와 다름) → 프론트 흐름 일부 변경 필요 | ⭐⭐⭐ |
| **B. Custom Auth Flow** (DefineAuthChallenge + VerifyAuthChallengeResponse Lambda 3종) | Hosted UI 안 써도 됨, UX 100% 제어 | Lambda 3개 + 카카오 토큰 검증 로직 직접 구현, 유지보수 부담 | ⭐ |
| **C. 백엔드 토큰 교환** (프론트가 카카오 토큰 받아 백엔드로 전달 → 백엔드가 Admin API 로 Cognito 사용자 생성/링크 → ID 토큰 발급) | 프론트 흐름 완전 자유 | 보안 책임 100% 백엔드, 유저풀 외부에서 토큰 발행해야 해서 표준 흐름 이탈 | ☆ |

이 문서는 **A 방식** 기준으로 정리.

---

## 2 · 사전 작업 — 카카오 디벨로퍼스 설정

### 2-1. 앱 생성

1. https://developers.kakao.com → 로그인 → **내 애플리케이션** → **애플리케이션 추가하기**
2. 앱 이름: `AISEO` (또는 원하는 이름) · 사업자명: K-RIDA
3. 생성 후 **앱 키** 탭에서 아래 두 값 메모:
   - **REST API 키** → Cognito 의 `client_id` 가 됨
   - (네이티브·JavaScript·Admin 키는 이번 통합에선 안 씀)
4. **보안** 탭 → **Client Secret** → **코드 생성 후 활성화 ON**
   - 생성된 시크릿 메모 → Cognito 의 `client_secret`
   - **⚠️ 활성화 안 하면 Cognito 가 422 던짐.** 카카오는 OIDC 표준상 secret 필수 아닌데 Cognito 는 OIDC provider 추가 시 secret 필수.

### 2-2. 카카오 로그인 활성화

1. 좌측 메뉴 **제품 설정 → 카카오 로그인** → **활성화 설정 ON**
2. **OpenID Connect 활성화 ON** (이게 핵심 — 안 하면 Cognito 의 OIDC discovery 가 실패)
3. **Redirect URI** 등록 (두 개 모두 — dev/prod 분리):
   ```
   https://<your-cognito-domain>.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse
   ```
   - `<your-cognito-domain>` 은 Cognito 콘솔의 **App integration → Domain** 에서 확인 가능
   - 만약 도메인이 dev/prod 별 풀이라 두 개라면 둘 다 등록

### 2-3. 동의 항목 설정

좌측 **카카오 로그인 → 동의 항목** 에서:

| 항목 | 동의 단계 | 비고 |
|---|---|---|
| `account_email` (카카오계정 이메일) | **필수 동의** | Cognito 는 email 클레임이 있어야 사용자 식별 가능. 필수 동의로 설정해야 카카오 익명 계정 차단 가능 |
| `profile_nickname` (닉네임) | 선택 동의 | `name` 속성에 매핑 |
| `profile_image` (프로필 사진) | 선택 동의 | 선택 |

> **카카오 검수**: `account_email` 을 "필수 동의" 로 신청하면 카카오 측 검수 (1~3 영업일) 가 필요할 수 있음. 검수 통과 전엔 본인의 앱 관리자 계정으로만 테스트 가능.

> **OpenID Connect 활성화 후** `openid` scope 가 자동으로 따라옴 — 따로 동의 항목 추가하지 않아도 됨.

---

## 3 · Cognito 콘솔 설정

### 3-1. Identity provider 등록

1. AWS Console → Cognito → 본 User Pool → **Authentication methods (로그인 환경)** 탭
2. **Federated identity provider sign-in** 섹션 → **Add identity provider**
3. Provider type: **OpenID Connect (OIDC)**
4. 폼 입력:

| 필드 | 값 |
|---|---|
| **Provider name** | `Kakao` (대소문자 주의 — 프론트에서 `identity_provider=Kakao` 로 호출) |
| **Client ID** | 카카오 REST API 키 |
| **Client secret** | 카카오 Client Secret |
| **Authorized scopes** | `openid account_email profile_nickname` (공백 구분) |
| **Attribute request method** | **POST** (GET 도 가능하나 POST 가 권장) |
| **Issuer URL** | `https://kauth.kakao.com` |

> Issuer URL 만 넣으면 Cognito 가 자동으로 `https://kauth.kakao.com/.well-known/openid-configuration` 을 호출해 endpoint 들을 가져옴. **OIDC 활성화 안 된 카카오 앱이면 이 단계에서 "Invalid configuration" 에러 발생** → 2-2 의 OIDC 활성화 재확인.

### 3-2. Attribute mapping

같은 화면 아래 **Attribute mapping** 에서:

| User pool attribute | OIDC claim |
|---|---|
| `email` | `email` |
| `name` | `nickname` |
| `email_verified` | `email_verified` |

> **`email_verified` 매핑이 핵심** — 매핑 안 하면 카카오로 첫 로그인한 사용자가 `Unconfirmed` 상태로 들어가 post-confirmation Lambda 가 호출되지 않고 community 그룹도 안 붙음.

> Cognito 의 `email` 속성은 기본적으로 "필수 + unique" 라, 같은 이메일로 일반 회원가입 후 카카오 로그인 시도하면 **`User already exists with the given email` 에러** 발생. 이건 4-3 의 계정 링크 방식으로 해결.

### 3-3. App client 에 Kakao 활성화

1. **App integration** 탭 → 본 App client 선택
2. **Hosted UI** 섹션 → **Edit**
3. **Identity providers** 에 **Kakao** 체크
4. **Allowed callback URLs** 확인 — 이전 작업에서 추가한 도메인들 (`https://aiseo.tips`, `https://site.aiseo.tips`, `https://b2b.aiseo.tips`, dev 도메인 동일) 모두 있어야 함
5. **OAuth 2.0 grant types**: `Authorization code grant` 체크
6. **OpenID Connect scopes**: `openid`, `email`, `profile` 체크
7. Save

### 3-4. Cognito Hosted UI Domain 확인

**App integration → Domain** 에서 본 풀의 Cognito 호스팅 도메인 확인. 예:
```
https://aiseo-prod.auth.ap-northeast-2.amazoncognito.com
https://aiseo-dev.auth.ap-northeast-2.amazoncognito.com
```

도메인이 아직 없으면 **Create Cognito domain** 으로 만든다 (prefix 만 정하면 됨, ALB 처럼 도메인 alias 도 가능하나 소셜 로그인엔 기본 cognito 도메인이 가장 간단).

---

## 4 · 프론트 코드 변경

### 4-1. 카카오 로그인 버튼 (`frontend/public/login.html`)

현재 login.html 은 `InitiateAuth` 직접 호출 방식이라 Hosted UI 와 공존시키려면 카카오 버튼만 Hosted UI URL 로 보내면 된다.

`이메일/비밀번호` 폼 아래에 버튼 추가:

```html
<button type="button" class="auth-btn-kakao" id="btn-kakao">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.74 1.74 5.16 4.4 6.62l-1.06 3.92c-.1.36.27.65.59.46l4.62-2.78c.47.06.94.1 1.45.1 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"/>
  </svg>
  카카오로 시작하기
</button>
```

대응 CSS (`auth-pages.css` 또는 login.html 인라인):

```css
.auth-btn-kakao {
  width:100%; height:52px; border-radius:14px; border:0;
  background:#FEE500; color:#181600;
  font-weight:700; font-size:14px;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  cursor:pointer; font-family:inherit;
  transition:background .15s, transform .05s;
  margin-top:6px;
}
.auth-btn-kakao:hover { background:#fbd900; }
.auth-btn-kakao:active { transform:translateY(1px); }
```

JS 핸들러:

```js
document.getElementById('btn-kakao').addEventListener('click', function(){
  var cognitoDomain = window.AISEO_LOGIN_CONFIG.cognitoDomain;  // login-config.js 에 추가
  var clientId      = COGNITO_CLIENT_ID;
  var redirectUri   = encodeURIComponent(window.location.origin + '/login.html');
  // Cognito Hosted UI 의 /oauth2/authorize 가 IdP 선택을 강제하면서
  // 카카오 로그인 화면으로 곧장 점프한다.
  var url = cognitoDomain + '/oauth2/authorize'
    + '?identity_provider=Kakao'
    + '&client_id=' + clientId
    + '&response_type=code'
    + '&scope=openid+email+profile'
    + '&redirect_uri=' + redirectUri;
  window.location.href = url;
});
```

### 4-2. 콜백 처리

Cognito 가 `redirect_uri` 로 사용자를 돌려보낼 때 `?code=AUTH_CODE` 가 붙는다. login.html 진입 시 `?code` 가 있으면 token endpoint 로 교환:

```js
(function handleOAuthCallback(){
  var params = new URLSearchParams(window.location.search);
  var code = params.get('code');
  if (!code) return;
  var cfg = window.AISEO_LOGIN_CONFIG || {};
  var body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cfg.clientId,
    code: code,
    redirect_uri: window.location.origin + '/login.html',
  });
  fetch(cfg.cognitoDomain + '/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if (d.id_token)     localStorage.setItem('aiseo.idToken', d.id_token);
    if (d.access_token) localStorage.setItem('aiseo.accessToken', d.access_token);
    window.location.replace('/account.html');
  })
  .catch(function(){
    // 토큰 교환 실패 → ?code 만 지우고 폼 다시 표시
    window.history.replaceState(null, '', '/login.html');
  });
})();
```

> **PKCE 미사용 주의**: App client 에 client secret 없는 public client 면 OAuth 2.0 표준상 PKCE 가 필수지만, Cognito 의 SPA 권장 설정 (no secret + PKCE) 으로 강제하지 않아도 동작은 함. 보안 강화 시 PKCE 추가 권장 — `code_verifier` 를 sessionStorage 에 저장 후 token 교환 시 동봉.

### 4-3. login-config.js 확장

```js
window.AISEO_LOGIN_CONFIG = {
  region: '%%COGNITO_REGION%%',
  clientId: '%%COGNITO_CLIENT_ID%%',
  cognitoDomain: '%%COGNITO_DOMAIN%%',  // 신규: e.g., https://aiseo-prod.auth.ap-northeast-2.amazoncognito.com
};
```

deploy 스크립트에 `%%COGNITO_DOMAIN%%` 치환 라인 추가:
```bash
_DOMAIN="${VITE_COGNITO_HOSTED_UI_DOMAIN:-$(grep '^VITE_COGNITO_HOSTED_UI_DOMAIN=' frontend/.env | cut -d= -f2-)}"
sed -e "s|%%COGNITO_DOMAIN%%|${_DOMAIN}|g" ...
```

---

## 5 · 그룹·등급 통합

이미 만들어 둔 post-confirmation Lambda (`backend/functions/auth-post-confirmation/handler.js`) 의 트리거 종류 가드를 확장하면 카카오 첫 로그인도 자동으로 community 그룹 부여됨.

```js
// 변경 전
if (trigger !== 'PostConfirmation_ConfirmSignUp') return event;

// 변경 후
if (trigger !== 'PostConfirmation_ConfirmSignUp'
 && trigger !== 'PostConfirmation_AdminConfirmSignUp') {
  return event;
}
```

> 외부 IdP (Federated) 첫 로그인은 `PostConfirmation_ConfirmSignUp` 이 정상적으로 발화. `AdminConfirmSignUp` 가드 추가는 콘솔 수동 확정 케이스까지 같이 잡으려는 보너스.

---

## 6 · 같은 이메일 사용자 처리 (계정 링크)

같은 사용자가 (a) 이메일 회원가입 후 (b) 카카오 로그인 시도하면 Cognito 가 `email already exists` 로 거부. AWS 권장 해결책은 **PreSignUp Lambda 에서 `AdminLinkProviderForUser` 호출** 로 외부 IdP 사용자를 기존 native 사용자에 강제 링크.

```
backend/functions/auth-pre-signup/handler.js  (신규 — P-X2 단계)
  trigger: PreSignUp_ExternalProvider
  → ListUsers(filter=email=...) 로 기존 native 사용자 존재 여부 확인
  → 있으면 AdminLinkProviderForUser 로 링크 (sub 통합)
  → 없으면 그대로 통과 → 신규 사용자로 생성
```

상세 패턴: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-identity-federation-consolidate-users.html

> 이 작업은 카카오 사용자가 실제로 늘어나기 시작할 때 (P-X2) 추가하면 충분. 초기에는 카카오로 첫 가입 → 별개 Cognito 사용자로 두고, 이메일 회원가입자와 충돌하면 사용자에게 "다른 방법으로 가입된 이메일" 안내 후 그쪽으로 유도하는 UX 도 가능.

---

## 7 · 한계 / 주의사항

| 항목 | 내용 |
|---|---|
| **카카오 이메일 미동의** | 사용자가 카카오 가입 시 이메일을 등록하지 않았거나 동의를 거부하면 `email` 클레임이 null → Cognito 가 사용자 생성 실패. "필수 동의" 로 설정해 가입 자체를 차단. |
| **카카오 비즈니스 채널** | 일반 앱은 일일 사용자 100명 한도. 100명 넘기면 비즈니스 채널 등록 (사업자 정보 + 검수 5~10영업일). 초기 테스트에는 무관. |
| **검수 기간** | 동의 항목 "필수" 신청 시 카카오 측 검수 1~3 영업일. 검수 전엔 본인 앱 관리자 계정으로만 테스트 가능. |
| **OIDC 미지원 구버전 앱** | 카카오 디벨로퍼스에서 2021년 이전에 만든 앱은 OIDC 활성화 메뉴가 없을 수 있음 → 새 앱 생성 권장. |
| **카카오 nickname 변경** | 카카오에서 닉네임 바꿔도 Cognito 의 `name` 속성은 첫 로그인 값으로 고정. 갱신하려면 pre-token-generation Lambda 가 매 로그인 시 재매핑해야 함. |
| **로그아웃** | Cognito 로그아웃만으로 카카오 세션은 안 끊김. 완전 로그아웃은 Cognito `/logout` 호출 후 추가로 `https://kauth.kakao.com/oauth/logout?client_id=...&logout_redirect_uri=...` 까지 chain 으로 호출. |

---

## 8 · 작업 순서 체크리스트

- [ ] **카카오 디벨로퍼스**: 앱 생성 → REST API 키 + Client Secret 메모
- [ ] **카카오 로그인 활성화** + **OpenID Connect 활성화** + Redirect URI 등록
- [ ] **동의 항목**: `account_email` 필수, `profile_nickname` 선택
- [ ] **검수 신청** (필수 동의 항목 있을 시) → 통과 대기
- [ ] **Cognito Hosted UI Domain** 확인/생성
- [ ] **Cognito Identity provider 추가** (OIDC, Issuer `https://kauth.kakao.com`)
- [ ] **Attribute mapping** (email, name, email_verified)
- [ ] **App client → Identity providers** 에 Kakao 추가
- [ ] **post-confirmation Lambda** 의 triggerSource 가드 확장
- [ ] **login-config.js** 에 `cognitoDomain` 추가 + deploy 스크립트 sed 라인 추가
- [ ] **login.html** 에 카카오 버튼 + OAuth 콜백 핸들러 추가
- [ ] **테스트**: 카카오 가입자 → Cognito Users 탭에 `External Provider: Kakao` 로 사용자 생성 + `community` 그룹 자동 부여 확인
- [ ] (선택) PreSignUp Lambda 로 동일 이메일 native ↔ external 링크 (P-X2)
