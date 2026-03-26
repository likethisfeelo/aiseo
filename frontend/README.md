# Frontend API/Cognito wiring (MVP)

이 폴더는 최소한의 API/Cognito 연동 코드를 포함합니다.

## 포함 파일
- `src/config.js`: dev/prod API base URL 및 Cognito 환경변수 로딩
- `src/auth.js`: 토큰 저장/헤더 생성 + Hosted UI login/logout URL 생성 + 콜백 토큰 파싱
- `src/api-client.js`: 공통 POST 클라이언트 (Authorization 헤더 자동 주입)
- `src/mvp-api.js`: `/upload-url`, `/validate`, `/deploy` 호출 래퍼

## 사용 예시
```js
import {
  buildLoginUrl,
  consumeCognitoCallbackTokens,
  buildLogoutUrl,
} from './src/auth.js';
import { createUploadUrl, validateSite, deploySite } from './src/mvp-api.js';

// 앱 시작 시 Cognito 콜백 토큰 소비
consumeCognitoCallbackTokens();

// 로그인 이동
window.location.href = buildLoginUrl();

// API 호출
const upload = await createUploadUrl({ siteId: 'site-1', fileName: 'site.zip' });
await validateSite({ siteId: 'site-1', objectKey: upload.objectKey });
await deploySite({ siteId: 'site-1', objectKey: upload.objectKey, env: 'dev' });

// 로그아웃 이동
window.location.href = buildLogoutUrl();
```

## 환경변수
`frontend/.env.example`를 참고해서 설정합니다.
