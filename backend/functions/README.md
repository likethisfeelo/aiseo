# Backend Lambda Functions

## Functions
- `upload-handler`: presigned URL 발급
- `validate-site`: S3 ZIP을 읽어 MVP 5개 규칙 검사 후 DynamoDB 저장
- `deploy-site`: 업로드 ZIP을 풀어 sites 버킷에 배포 + CloudFront invalidation

## 공통 응답 포맷
```json
{ "success": true, "data": {} }
{ "success": false, "error": "message" }
```

## validate-site 환경변수
- `UPLOAD_BUCKET`
- `REPORTS_TABLE`

## deploy-site 입력 예시
```json
{
  "siteId": "site-123",
  "env": "dev",
  "objectKey": "uploads/site-123/1710000000000-site.zip"
}
```

## deploy-site 환경변수
- `UPLOAD_BUCKET`
- `SITES_BUCKET`
- `SITES_BUCKET_DEV`
- `DISTRIBUTION_ID`
- `DISTRIBUTION_ID_DEV`
- `BASE_DOMAIN`
- `DEV_DOMAIN`

## Run checks
```bash
cd backend/functions
npm install
npm run check
```
