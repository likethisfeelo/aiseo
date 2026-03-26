# AISEO Platform

> AI로 만든 정적 사이트 ZIP을 업로드하면 구조/SEO를 검증하고, 리포트를 제공한 뒤 S3/CloudFront로 배포하고 운영 코드를 삽입할 수 있게 하는 플랫폼

---

## 서비스 한 줄 정의

사용자가 AI로 만든 정적 사이트 ZIP을 업로드하면 구조/SEO를 검증하고, 리포트를 제공한 뒤 S3/CloudFront로 배포하고 운영 코드를 삽입할 수 있게 하는 플랫폼

---

## MVP 범위

### 포함
- 로그인 (Cognito)
- 사이트 생성
- ZIP 업로드 (presigned URL)
- 기본 구조/SEO 검사 5개
- 리포트 표시
- 기본 배포 (서브도메인)
- 운영 코드 삽입 (GA4 / Search Console / Naver)

### 제외 (지금 하지 않음)
- AI 자동 수정
- 결제
- 관리자 통계
- 고급 SEO 분석
- A/B 테스트
- 협업 기능

**핵심: "업로드 → 검증 → 배포" 1개 흐름 완성**

---

## 전체 아키텍처

```
Frontend (Vite + React)
   ↓
API Gateway
   ↓
Lambda
   ↓
S3 (upload)
   ↓
Lambda validate
   ↓
DynamoDB (report)
   ↓
Lambda deploy
   ↓
S3 (sites)
   ↓
CloudFront → {siteId}.aiseo.tips
```

---

## 폴더 구조

```
aiseo/
├── frontend/              # Vite + React + TypeScript
├── backend/
│   └── functions/
│       ├── upload-handler/    # presigned URL 생성
│       ├── validate-site/     # ZIP 검사 + 리포트 저장
│       └── deploy-site/       # S3 복사 + CloudFront invalidation
├── infra/
│   └── cdk/               # AWS CDK (TypeScript)
├── docs/
├── CODEX_BRIEFING.md      # Codex/Claude Code 작업 브리핑
├── .env                   # 환경변수 (커밋 금지)
├── .env.example
└── README.md
```

---

## 기능 명세

### 사용자 플로우
```
로그인 → 사이트 생성 → ZIP 업로드 → validate → 리포트 확인 → deploy → 코드 삽입
```

### API 엔드포인트

| Method | Path | Lambda | 설명 |
|---|---|---|---|
| POST | /upload-url | upload-handler | presigned URL 반환 |
| POST | /validate | validate-site | ZIP 검사 후 리포트 저장 |
| POST | /deploy | deploy-site | S3 복사 + CloudFront invalidation |

### validate 검사 규칙 (MVP 5개)

1. index.html 존재 여부
2. robots.txt 존재 여부
3. sitemap.xml 존재 여부
4. title 태그 존재 여부
5. meta description 존재 여부

### 운영 코드 삽입

| 코드 | 처리 방식 |
|---|---|
| GA4 | HTML `<head>` 삽입 |
| Search Console meta | HTML `<head>` 삽입 |
| Naver 웹마스터 | HTML `<head>` 삽입 |

---

## AWS 인프라

### 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Vite + React + TypeScript |
| Auth | AWS Cognito (SPA) |
| API | AWS API Gateway |
| Backend | AWS Lambda (Node.js 20) |
| DB | AWS DynamoDB (온디맨드) |
| Storage | AWS S3 |
| CDN | AWS CloudFront |
| IaC | AWS CDK (TypeScript) |
| DNS/TLS | Route 53 + ACM |

### 도메인

| 환경 | URL |
|---|---|
| prod | https://aiseo.tips |
| dev | https://dev.aiseo.tips |
| 사이트 서빙 | https://{siteId}.aiseo.tips |

### S3 버킷

| 버킷명 | 용도 | 특이사항 |
|---|---|---|
| aiseo-upload-bucket | ZIP 임시 보관 | 7일 수명주기 |
| aiseo-sites-bucket | prod 사이트 파일 | CloudFront OAC |
| aiseo-sites-dev-bucket | dev 사이트 파일 | CloudFront OAC |

### DynamoDB 테이블

| 테이블명 | PK | SK | 용도 |
|---|---|---|---|
| aiseo-sites | siteId (S) | - | 사이트 메타 정보 |
| aiseo-reports | siteId (S) | createdAt (S) | 검증 리포트 히스토리 |

---

## 개발 방식

- **로컬 개발 없음** — Cognito 특성상 CloudFront 환경에서 직접 확인
- dev 작업 → `https://dev.aiseo.tips` 에서 확인
- prod 배포 → `https://aiseo.tips` 에서 확인
- 브랜치: `main` 단일 운영
- 배포: S3 업로드 + CloudFront invalidation

---

## 개발 순서

```
Step 1. CDK 스택 작성 (Lambda 3개 + API Gateway)
Step 2. Lambda — upload-handler 구현
Step 3. Lambda — validate-site 구현
Step 4. Lambda — deploy-site 구현
Step 5. Frontend 생성 (Vite + React)
Step 6. 프론트 ↔ API 연결
Step 7. Cognito 로그인 연결
Step 8. 운영 코드 삽입 기능
```

---

## 품질 기준

- 모든 API 응답 JSON 통일 `{ success, data }` / `{ success, error }`
- 에러 메시지 반드시 포함
- loading 상태 반드시 구현
- 빈 화면 없음
- CloudWatch 로그 남김
- Lambda 타임아웃: upload 30초 / validate 30초 / deploy 60초

---

## 성공 기준 (MVP 완료 조건)

- ZIP 업로드 가능
- validate 결과 확인 가능
- deploy 가능
- `{siteId}.aiseo.tips` URL 접속 가능

---

## 환경 설정

```bash
# AWS 프로파일 확인
.\use-aiseo.ps1

# CDK 배포
cd infra/cdk
npx aws-cdk deploy --profile aiseo
```
