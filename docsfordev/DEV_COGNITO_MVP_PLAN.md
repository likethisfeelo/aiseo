# Dev 환경 Cognito 연동 중심 MVP 작업 계획

## 배경 정리
- 현재 프로젝트 문서 기준으로 **로컬 개발이 아닌 dev CloudFront 환경(`https://dev.aiseo.tips`)에서 확인**하는 방식이 기본이다.
- Cognito(SPA)는 redirect URI, 도메인, CORS 조건 때문에 로컬과 dev 동작이 달라질 수 있다.
- 따라서 이번 작업은 “람다 먼저 → dev에서 실제 Cognito 연결 검증 → MVP 플로우 완성” 순서로 진행한다.

---


## 현재 진행 상태 (2026-03-26 기준)

### 완료된 항목
- [x] Lambda 3종 기본 구현 (`upload-handler`, `validate-site`, `deploy-site`)
- [x] `validate-site` ZIP 실제 검사 + DynamoDB 저장
- [x] `deploy-site` ZIP 기반 실제 배포 + CloudFront invalidation
- [x] API Gateway 리소스(`/upload-url`, `/validate`, `/deploy`) 및 `dev`/`prod` stage 구성
- [x] DEV/PROD API 분리 원칙 반영
- [x] (옵션) Cognito User Pool Authorizer 연결 가능하도록 CDK 반영
- [x] 프론트 최소 API/Cognito 유틸 추가(토큰 저장, Hosted UI login/logout URL, 콜백 토큰 소비)

### 남은 핵심 항목
- [ ] 실제 AWS 배포(`cdk deploy`) 후 dev URL에서 E2E 확인
- [ ] Cognito App Client callback/logout URL과 프론트 env 최종 정합성 확인
- [ ] 프론트 업로드/검증/배포 UI 연결(현재는 유틸만 있음)
- [ ] 실패 시나리오(잘못된 ZIP, 만료 토큰, 401/403) UX 보강

### 체감 진행률
- 백엔드/인프라: 약 **80~85%**
- 프론트 UX: 약 **35~40%**
- 전체 MVP E2E: 약 **65~70%**

---
## 목표
1. Lambda 3종(`upload-handler`, `validate-site`, `deploy-site`)을 먼저 안정화한다.
2. dev 환경에서 실제 Cognito 로그인/토큰/API 인증 흐름을 확인한다.
3. MVP 핵심 경로(업로드 → 검증 → 배포)가 **dev에서 끝까지 재현**되도록 만든다.
4. 로컬/개발환경 차이로 인한 이슈를 체크리스트화한다.
5. API를 DEV/PROD로 분리해 환경별 엔드포인트/인증정책을 독립 운영한다.

---

## 0단계: 선행 점검 (반나절)

### 체크리스트
- [ ] AWS 프로파일 `aiseo`, 리전 `ap-northeast-2` 확인
- [ ] Cognito User Pool / App Client 설정값 최신 여부 확인
- [ ] dev 도메인(`dev.aiseo.tips`)과 Cognito callback/logout URL 일치 확인
- [ ] API Gateway CORS + Authorizer 구성 계획 확정
- [ ] DEV/PROD API 엔드포인트 분리 방식(도메인 또는 stage) 확정
- [ ] `.env`에 필요한 키 누락 확인

### 산출물
- `환경 준비 완료` 체크 문서 (간단 메모)

---

## 1단계: Lambda 우선 구현 (1~2일)

## 1-1. upload-handler
### 기능
- 사이트 업로드용 presigned URL 발급
- 입력값: `siteId`, 파일 메타
- 출력값: `{ uploadUrl, objectKey }`

### 완료 기준
- [ ] 유효성 검사(필수 필드, 파일 확장자, 크기 제한)
- [ ] JSON 응답 형식 준수
- [ ] CloudWatch 로그에 요청 식별자 기록

## 1-2. validate-site
### 기능
- 업로드된 ZIP 검사 후 리포트 저장
- MVP 5개 규칙 검사: index/robots/sitemap/title/meta description

### 완료 기준
- [ ] 5개 규칙 pass/fail 리포트 생성
- [ ] DynamoDB(`aiseo-reports`) 저장
- [ ] 실패 시 원인 메시지 명확화

## 1-3. deploy-site
### 기능
- 검증 완료 산출물을 sites 버킷에 배포
- CloudFront invalidation 실행

### 완료 기준
- [ ] dev/prod 분기 로직 확인
- [ ] 배포 URL 반환
- [ ] invalidation 요청 ID 로그 남김

---

## 2단계: API 환경 분리 + 최소 프론트 연결 (1~2일)

### API 분리 원칙 (필수)
- DEV/PROD는 **반드시 분리된 API 엔드포인트**를 사용한다.
- 각 환경은 CORS 허용 Origin, Authorizer 설정, CloudWatch 로그 그룹을 분리한다.
- 프론트는 환경 변수로 API Base URL을 분기한다.

예시:
- DEV API: `https://api-dev.aiseo.tips` (또는 dev stage 전용 URL)
- PROD API: `https://api.aiseo.tips` (또는 prod stage 전용 URL)

### 작업
- [ ] API Gateway에 `/upload-url`, `/validate`, `/deploy`를 DEV/PROD 각각 연결
- [ ] DEV/PROD 각각 Cognito Authorizer 연결 확인
- [ ] DEV/PROD 각각 CORS Origin(`dev.aiseo.tips`, `aiseo.tips`) 설정
- [ ] 공통 응답 스키마 강제
- [ ] 프론트에서 환경변수 기준 API Base URL 분기 적용
- [ ] 최소 1페이지에서 API 3개 호출 연결
- [ ] 에러/로딩 상태 노출

### 완료 기준
- [ ] DEV 프론트는 DEV API만 호출하고 정상 응답
- [ ] PROD 프론트는 PROD API만 호출하고 정상 응답
- [ ] 브라우저에서 실제 업로드~검증~배포 요청이 왕복됨

---

## 3단계: dev에서 Cognito 실제 연동 검증 (핵심, 1일)

## 3-1. 인증 기본 동작
- [ ] `https://dev.aiseo.tips` 진입 시 로그인 흐름 정상
- [ ] Hosted UI → redirect → 프론트 복귀 정상
- [ ] ID/Access 토큰 획득 및 만료 처리 확인

## 3-2. 인증 기반 API 호출
- [ ] 로그인 전 API 접근 제한 확인
- [ ] 로그인 후 Authorization 헤더로 호출 성공
- [ ] 토큰 만료/로그아웃 후 401 처리 확인

## 3-3. 로컬 대비 차이 검증 포인트
- [ ] Callback URL 불일치 여부
- [ ] 쿠키/SameSite/HTTPS 영향
- [ ] CORS origin 정확성
- [ ] CloudFront 캐시로 인한 오래된 설정 반영 문제

### 완료 기준
- [ ] dev에서 인증 + DEV API 호출 + 화면 반영이 end-to-end로 재현됨
- [ ] 이슈/원인/조치 내용을 표로 정리

---

## 4단계: MVP E2E 리허설 (반나절)

### 시나리오
1. 로그인
2. 사이트 생성
3. ZIP 업로드
4. validate 결과 확인
5. deploy 실행
6. 배포 URL 접속 확인

### 완료 기준
- [ ] 시나리오 1회 이상 실패 없이 통과
- [ ] 실패 케이스(잘못된 ZIP)도 의도대로 처리

---

## 권장 작업 순서 (요약)
1. **Lambda 먼저 완성**
2. **API DEV/PROD 분리 구성**
3. 최소 프론트 연결(환경변수 분기)
4. **dev에서 Cognito + DEV API 실제 검증**
5. E2E 리허설 후 MVP 고정

---

## 리스크 & 대응
- 리스크: Cognito redirect 설정 누락
  - 대응: callback/logout URL을 dev/prod 각각 명시적으로 관리
- 리스크: CloudFront 캐시로 설정 반영 지연
  - 대응: 변경 시 invalidation 또는 쿼리스트링 버전 관리
- 리스크: 인증은 성공했는데 API 401
  - 대응: API Authorizer 토큰 소스(`Authorization: Bearer`) 고정
- 리스크: dev 프론트가 prod API를 잘못 호출
  - 대응: `VITE_API_BASE_URL`을 환경별 배포 파이프라인에서 강제 주입

---

## 바로 실행할 첫 태스크 (오늘)
1. upload-handler 입력/응답 스키마 고정
2. validate-site 5개 규칙 리포트 JSON 고정
3. DEV/PROD API 엔드포인트 분리 및 CORS 매핑 확정
4. dev 도메인 기준 Cognito callback URL 재검증
5. `https://dev.aiseo.tips`에서 로그인 + DEV API 호출 성공까지 먼저 확인

