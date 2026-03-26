# AISEO Platform — Codex 작업 브리핑

## 1. 프로젝트 한 줄 정의

사용자가 AI로 만든 정적 사이트 ZIP을 업로드하면
구조/SEO를 검증하고, 리포트를 제공한 뒤
S3/CloudFront로 배포하고 운영 코드를 삽입할 수 있게 하는 플랫폼

---

## 2. 핵심 사용자 플로우 (MVP)

```
로그인 → 사이트 생성 → ZIP 업로드 → validate → 리포트 확인 → deploy → 코드 삽입
```

---

## 3. MVP 범위 (절대 고정)

### 포함
- 로그인 (Cognito)
- 사이트 생성
- ZIP 업로드 (presigned URL)
- 기본 구조/SEO 검사 5개
- 리포트 표시
- 기본 배포 (서브도메인)
- 운영 코드 삽입 (GA4 / Search Console / Naver)

### 제외 (절대 하지 않음)
- AI 자동 수정
- 결제
- 관리자 통계
- 고급 SEO 분석
- A/B 테스트
- 협업 기능

---

## 4. 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Vite + React + TypeScript |
| Auth | AWS Cognito (SPA 클라이언트) |
| API | AWS API Gateway |
| Backend | AWS Lambda (Node.js 20) |
| DB | AWS DynamoDB (온디맨드) |
| Storage | AWS S3 |
| CDN | AWS CloudFront |
| IaC | AWS CDK (TypeScript) |
| DNS/TLS | Route 53 + ACM |

---

## 5. 폴더 구조

```
C:\aiseo\
├── frontend/              # Vite + React (아직 미생성)
├── backend/
│   └── functions/
│       ├── upload-handler/    # presigned URL 생성
│       ├── validate-site/     # ZIP 검사
│       └── deploy-site/       # S3 배포
├── infra/
│   └── cdk/               # CDK 스택 (bootstrap 완료)
├── docs/
├── .env                   # 환경변수 (커밋 금지)
├── .env.example
├── .gitignore
└── README.md
```

---

## 6. AWS 인프라 현황 (완료)

### S3 버킷
| 버킷명 | 용도 |
|---|---|
| aiseo-upload-bucket | ZIP 임시 업로드 (7일 수명주기) |
| aiseo-sites-bucket | prod 배포 사이트 |
| aiseo-sites-dev-bucket | dev 배포 사이트 |

### DynamoDB 테이블
| 테이블명 | PK | SK |
|---|---|---|
| aiseo-sites | siteId (S) | - |
| aiseo-reports | siteId (S) | createdAt (S) |

### CloudFront
| 구분 | Distribution ID | 도메인 |
|---|---|---|
| prod | EZSNEM80TUP6K | d3osxtnjdpngji.cloudfront.net |
| dev | E2SBJ84WHHWIJM | d3lm5va2mg67de.cloudfront.net |

### 도메인
| 용도 | URL |
|---|---|
| prod | https://aiseo.tips |
| dev | https://dev.aiseo.tips |

### Cognito
- User Pool ID: ap-northeast-2_5WQyPlskY
- App Client ID: 3kks7ki628d9fnpca07bd1kvc5
- 앱 유형: 퍼블릭 클라이언트 (SPA)
- 로그인: 이메일

### AWS 계정
- Account ID: 119778517834
- Region: ap-northeast-2
- Profile: aiseo
- CDK bootstrap: 완료

---

## 7. 환경변수 (.env)

```dotenv
# S3
UPLOAD_BUCKET=aiseo-upload-bucket
SITES_BUCKET=aiseo-sites-bucket
SITES_BUCKET_DEV=aiseo-sites-dev-bucket

# DynamoDB
SITES_TABLE=aiseo-sites
REPORTS_TABLE=aiseo-reports

# CloudFront (prod)
DISTRIBUTION_ID=EZSNEM80TUP6K
CLOUDFRONT_DOMAIN=d3osxtnjdpngji.cloudfront.net

# CloudFront (dev)
DISTRIBUTION_ID_DEV=E2SBJ84WHHWIJM
CLOUDFRONT_DOMAIN_DEV=d3lm5va2mg67de.cloudfront.net

# Cognito
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_5WQyPlskY
VITE_COGNITO_CLIENT_ID=3kks7ki628d9fnpca07bd1kvc5

# Domain
BASE_DOMAIN=aiseo.tips
DEV_DOMAIN=dev.aiseo.tips

# AWS
AWS_REGION=ap-northeast-2
AWS_PROFILE=aiseo
```

---

## 8. API 설계 (MVP)

| Method | Path | Lambda | 설명 |
|---|---|---|---|
| POST | /upload-url | upload-handler | presigned URL 반환 |
| POST | /validate | validate-site | ZIP 검사 후 리포트 저장 |
| POST | /deploy | deploy-site | S3 복사 + CloudFront invalidation |

### 공통 응답 형식
```json
{ "success": true, "data": {} }
{ "success": false, "error": "메시지" }
```

---

## 9. validate 검사 규칙 5개 (MVP)

1. index.html 존재 여부
2. robots.txt 존재 여부
3. sitemap.xml 존재 여부
4. title 태그 존재 여부
5. meta description 존재 여부

---

## 10. 서브도메인 구조

```
{siteId}.aiseo.tips      → prod 배포 사이트
{siteId}.dev.aiseo.tips  → dev 배포 사이트 (추후)
```

와일드카드 *.aiseo.tips → CloudFront prod로 연결됨

---

## 11. 개발 방식

- **로컬 개발 없음** — CloudFront로 직접 확인 (Cognito 때문)
- dev 환경: https://dev.aiseo.tips 에서 확인
- prod 환경: https://aiseo.tips
- 브랜치: main 단일 브랜치 운영
- 배포: S3 업로드 + CloudFront invalidation

---

## 12. 개발 순서 (다음 작업)

```
Step 1. CDK 스택 작성 (Lambda 3개 + API Gateway)
Step 2. Lambda 함수 구현 (upload-handler)
Step 3. Lambda 함수 구현 (validate-site)
Step 4. Lambda 함수 구현 (deploy-site)
Step 5. Frontend 생성 (Vite + React)
Step 6. 프론트 ↔ API 연결
Step 7. Cognito 로그인 연결
Step 8. 운영 코드 삽입 기능
```

---

## 13. 코드 작업 단위 (Codex 권장)

### 좋은 단위 ✅
- upload-handler Lambda 작성
- validate Lambda에서 index.html 검사만 추가
- deploy Lambda S3 복사 로직
- 리포트 UI 컴포넌트 작성
- ZIP 업로드 UI 작성

### 나쁜 단위 ❌
- 전체 SaaS 만들어줘
- 백엔드 전체 작성해줘
- 프론트엔드 다 만들어줘

---

## 14. 품질 기준

- 모든 API 응답 JSON 통일
- 에러 메시지 반드시 포함
- loading 상태 반드시 구현
- 빈 화면 없음
- CloudWatch 로그 남김
- Lambda 타임아웃: upload 30초 / validate 30초 / deploy 60초

---

## 15. GitHub

- Repository: https://github.com/likethisfeelo/aiseo
- 브랜치: main
- SSH Host: github-aiseo
