# AISEO CDK

이 스택은 MVP 백엔드 리소스를 생성합니다.

## 생성 리소스
- Lambda 3개
  - `upload-handler`
  - `validate-site`
  - `deploy-site`
- API Gateway (`/upload-url`, `/validate`, `/deploy`)
- API Stage 2개 (`dev`, `prod`)
- (선택) Cognito User Pool Authorizer

## Context / Environment
아래 값은 context 또는 환경변수로 주입 가능합니다.

- `uploadBucketName` (or `UPLOAD_BUCKET`)
- `reportsTableName` (or `REPORTS_TABLE`)
- `sitesBucketName` (or `SITES_BUCKET`)
- `sitesBucketDevName` (or `SITES_BUCKET_DEV`)
- `BASE_DOMAIN`
- `DEV_DOMAIN`
- `DISTRIBUTION_ID`
- `DISTRIBUTION_ID_DEV`
- `cognitoUserPoolArn` (or `COGNITO_USER_POOL_ARN`)
- `devOrigin` (or `DEV_ORIGIN`)
- `prodOrigin` (or `PROD_ORIGIN`)

## Commands
```bash
cd infra/cdk
npm run build
npm run test
npx cdk synth
```
