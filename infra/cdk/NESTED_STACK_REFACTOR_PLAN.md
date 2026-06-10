# CdkStack Nested Stack 리팩터 계획

> 목적: CloudFormation **스택당 리소스 500개 하드 리밋**을 구조적으로 해소한다.
> 현재(LogGroup 플래그 off 적용 후) `CdkStack` ≈ **485/500** — 여유 15개. Lambda·라우트를 더 붙이면 곧 다시 막힌다.

---

## 1. 배경 / 왜 막혔나

직전 배포 실패:
```
TooManyResourcesInStack: 'CdkStack': 513 > 500
AWS::ApiGateway::Method (150), AWS::Lambda::Permission (159),
AWS::ApiGateway::Resource (70), Lambda::Function (28), IAM::Role (28),
IAM::Policy (28), Logs::LogGroup (28), DynamoDB::Table (14) ...
```

리소스 분포(513 기준):
- **API Gateway 계열 ≈ 379** (Method 150 + Permission 159 + Resource 70) ← 가장 큼
- **Lambda 1개당 4리소스** (Function + Role + Policy + LogGroup) × 28 = **112**
- DynamoDB Table 14, 기타(RestApi/Authorizer/Deployment/Stage/GatewayResponse) ≈ 8

임시 조치로 `@aws-cdk/aws-lambda:useCdkManagedLogGroup: false` → LogGroup 28개 제거(513→485). 단 이건 미봉책이고, 다음 기능에서 재발한다.

---

## 2. 핵심 원칙 (안전이 최우선)

### 2-1. Stateful 리소스는 절대 옮기지 않는다
스택 간 리소스 이동은 CloudFormation 입장에서 **기존 스택에서 DELETE + 신규 스택에서 CREATE**다(논리적 ID/소속 스택이 바뀌므로). 따라서:

- ❌ **옮기면 안 되는 것(데이터 유실 위험)**: `DynamoDB::Table`(14개 전부), `S3::Bucket`, `Cognito::UserPool`/`UserPoolClient`, 기타 데이터 보관 리소스.
  → **전부 부모 `CdkStack`에 그대로 둔다.**
- ✅ **옮겨도 안전한 것(상태 없음, 재생성 OK)**: `Lambda::Function`, `IAM::Role`/`Policy`, `ApiGateway::Resource`/`Method`, `Lambda::Permission`.
  → 이것들을 NestedStack으로 이동해 카운트를 분산한다.

> NestedStack 1개 = 부모 스택에서 `AWS::CloudFormation::Stack` **단 1개**로 카운트된다. 자식 스택은 각자 별도 500 한도를 가진다.

### 2-2. 의존성은 단방향 (부모 → 자식)
공유 리소스(RestApi, Cognito Authorizer, 모든 Table, Bucket)는 부모에 두고, 자식 스택은 **props로 주입받아 참조만** 한다. 자식↔자식 상호 참조는 순환 의존을 만들므로 금지.

---

## 3. 가장 큰 난관: 단일 RestApi + Deployment

API Gateway는 RestApi 1개에 Resource/Method 379개가 매달려 있다. 이걸 분산하려면:

1. **RestApi·Authorizer·Deployment·Stage는 부모에 유지.**
2. 각 NestedStack은 props로 `IRestApi`(또는 부모의 특정 `IResource`)와 `IAuthorizer`를 받아 **자기 그룹의 Resource/Method/Lambda Permission을 자식 스택 안에 생성**한다. (CDK는 같은 App 내 cross-stack 참조를 CfnOutput/Parameter로 자동 처리)
3. ⚠️ **Deployment 재배포 gotcha**: `Deployment` 리소스는 "현재 알고 있는 Method 집합"의 해시로 갱신된다. Method가 자식 스택에 있으면, Method만 바뀌었을 때 부모의 Deployment가 **자동으로 새 배포를 트리거하지 않아** 변경이 라이브에 반영 안 될 수 있다.
   **해결책(둘 중 하나):**
   - (a) 부모에서 `Deployment`를 명시 생성하고, 라우트 구성 버전 문자열을 `addToLogicalId()`/description에 넣어 라우트가 바뀔 때마다 강제로 새 Deployment 생성. 자식 스택들에 `deployment.node.addDependency(nestedStack)` 추가.
   - (b) 더 단순: 자식 스택의 라우트 구성이 바뀔 때 배포 시 `--all` + 수동으로 stage redeploy. (운영 실수 여지 있어 비권장)
   → **(a) 권장.**

---

## 4. 제안 그룹핑 (NestedStack 분할)

28개 Lambda를 응집도 기준으로 묶는다. 각 그룹은 자기 Lambda + IAM + 라우트(Resource/Method/Permission)만 자식 스택에 담고, **Table/Bucket은 부모 것을 props로 주입**받는다.

| NestedStack | 포함 Lambda(예시) | 비고 |
|---|---|---|
| **SiteBuilderStack** | upload, validate, deploy, select, brand, products, services, store, seoSnapshot, seoAutoCheck, domainChange, imageUpload (~12) | 가장 무거운 그룹. `sitesTable`·배포 버킷 주입 |
| **LeadsStack** (마케팅/리드) | consultation, **b2bConsultation**, courseInquiry, eventSignup, newsletter (~5) | `consultations`·`aiseo-b2b-consultations` 등 테이블 주입. 신규 B2B 포함 |
| **ContentStack** | blog, library, comments, adminComment (~4) | blog/library/comments 테이블 주입 |
| **부모 CdkStack (유지)** | me, siteSettings, adminUsers, adminSites, quotaStatus, adminQuotaPolicy, authPostConfirmation + **모든 Table/Bucket/UserPool + RestApi + Authorizer + Deployment + Stage** | 공유·인증·소량 그룹 |

예상 효과: 부모에서 약 21개 Lambda 그룹(× 라우트 포함 수백 리소스)이 자식 3개(= 부모 카운트 3)로 빠져 **부모는 200~300대**로 내려간다. 자식 각각도 500 한도 내 충분.

> 그룹 경계는 "함께 자주 바뀌고, 같은 테이블을 공유하는가"로 잡았다. 실제 의존(어떤 Lambda가 어떤 Table을 grant 받는지)을 코드에서 재확인 후 미세조정.

---

## 5. 코드 구조 스케치

```
infra/cdk/
  bin/cdk.ts                 // 그대로 (CdkStack 1개 인스턴스화)
  lib/
    cdk-stack.ts             // 부모: Table/Bucket/UserPool/RestApi/Authorizer/Deployment
                             //       + 공유 Lambda. 자식 NestedStack 3개 생성·props 전달
    nested/
      site-builder-stack.ts  // class SiteBuilderStack extends NestedStack
      leads-stack.ts         // class LeadsStack extends NestedStack
      content-stack.ts       // class ContentStack extends NestedStack
```

부모에서 자식 생성(개념 예시):
```ts
const leads = new LeadsStack(this, 'LeadsStack', {
  api,                       // IRestApi (부모 소유)
  authorizer,                // 부모 Cognito authorizer
  adminResource,             // 부모의 api.root /admin Resource
  functionsRoot,             // lambda.Code.fromAsset 경로
  tables: {
    consultations: consultationsTable,
    b2bConsultations: b2bConsultationsTable,
    courseInquiries: courseInquiriesTable,
    // ...
  },
  corsOrigins: [devOrigin, prodOrigin, siteDevOrigin, siteProdOrigin, b2bDevOrigin, b2bProdOrigin],
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL ?? '',
});
```

자식 스택 내부(개념 예시):
```ts
export interface LeadsStackProps extends NestedStackProps {
  api: apigateway.IRestApi;
  authorizer: apigateway.IAuthorizer;
  adminResource: apigateway.IResource;
  tables: { consultations: dynamodb.ITable; b2bConsultations: dynamodb.ITable; /*...*/ };
  functionsRoot: string;
  corsOrigins: string[];
  slackWebhookUrl: string;
}

export class LeadsStack extends NestedStack {
  constructor(scope: Construct, id: string, props: LeadsStackProps) {
    super(scope, id, props);

    const b2b = new lambda.Function(this, 'B2BConsultationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(props.functionsRoot),
      handler: 'b2b-consultation/handler.handler',
      environment: {
        B2B_CONSULTATIONS_TABLE: props.tables.b2bConsultations.tableName,
        SLACK_WEBHOOK_URL: props.slackWebhookUrl,
      },
    });
    props.tables.b2bConsultations.grantReadWriteData(b2b); // cross-stack grant OK

    const b2bRes = props.api.root.addResource('b2b-consultation', {
      defaultCorsPreflightOptions: { allowOrigins: props.corsOrigins, /*...*/ },
    });
    b2bRes.addMethod('POST', new apigateway.LambdaIntegration(b2b), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    props.adminResource.addResource('b2b-consultations')
      .addMethod('GET', new apigateway.LambdaIntegration(b2b), { authorizer: props.authorizer });
    // consultation / courseInquiry / eventSignup / newsletter 동일 패턴 이동
  }
}
```

> `props.api.root.addResource(...)`로 자식 스택에서 부모 RestApi에 Resource를 추가하면, 그 Resource/Method/Permission는 **자식 스택 템플릿**에 들어간다(= 부모 카운트에서 빠짐). grant·env는 cross-stack 참조로 자동 연결.

---

## 6. 마이그레이션 절차 (단계적·검증 우선)

이 작업은 **리소스 재생성**을 동반하므로 한 번에 다 옮기지 말고 단계적으로:

1. **사전 점검**: `cdk diff`로 현 상태 스냅샷. 모든 Table/Bucket/UserPool의 `RemovalPolicy`가 `RETAIN`인지 확인(만약 DESTROY면 먼저 RETAIN으로 바꿔 배포해 안전망 확보).
2. **Phase 1 — LeadsStack 1개만 추출** (가장 작고 신규 B2B 포함, 의존 적음):
   - 코드 이동 후 `cdk synth` → 생성된 템플릿에서 **DynamoDB/S3/Cognito 변경이 0인지** 반드시 확인. Lambda/Role/Method/Permission의 delete+create만 있어야 한다.
   - `cdk diff` 검토 → **dev/staging 계정에 먼저 배포**.
   - 배포 중 해당 라우트 순단(수초~수십초) 가능 — 점검 시간대 권장.
   - 라우트가 실제로 새 Deployment로 반영됐는지 확인(§3 gotcha 해결책 (a) 적용).
3. **Phase 2 — ContentStack 추출**, 동일 검증.
4. **Phase 3 — SiteBuilderStack 추출**(가장 큼), 동일 검증.
5. 각 Phase 후 부모 리소스 수를 `cdk synth` 산출 템플릿에서 카운트해 500 아래·여유 충분 확인.

### 롤백
각 Phase는 독립 커밋. 문제 시 직전 커밋으로 되돌려 재배포하면 자식 스택이 다시 부모로 합쳐진다(역시 재생성 동반).

---

## 7. 주의/리스크 요약

- **데이터 유실 방지**: Table/Bucket/UserPool은 절대 이동 금지(부모 유지). 이동 대상은 무상태 리소스만.
- **라우트 순단**: Lambda/Method 재생성 시 해당 엔드포인트가 잠깐 끊길 수 있음 → 트래픽 적은 시간대 배포.
- **Deployment 재배포 gotcha**(§3): 반드시 해결책 (a) 적용, 배포 후 실제 응답으로 라우트 반영 확인.
- **검증 한계**: 현재 클라우드 작업 환경은 네트워크 차단·`infra/cdk/node_modules` 미설치로 `cdk synth`/`deploy` 불가. **로컬(개발자 머신)에서 `npm ci && npx cdk synth && npx cdk diff`로 검증**하며 진행해야 함.
- **IAM 권한**: cross-stack grant는 정상 동작하나, 자식 스택의 Role이 부모 Table을 참조하는 정책이 잘 생성됐는지 diff에서 확인.

---

## 8. 빠른 대안(임시 여유가 더 필요할 때)
리팩터 전 급하게 몇 개 더 줄여야 하면:
- 공유 IAM Role을 여러 Lambda가 재사용(Role/Policy 개수 절감) — 단 최소권한 원칙 약화.
- 사용 안 하는 라우트/Lambda 제거.
- 단, 근본 해결은 본 문서의 NestedStack 분할이다.

---

### 체크리스트
- [ ] Table/Bucket/UserPool RemovalPolicy = RETAIN 확인
- [ ] `nested/leads-stack.ts` 작성, consultation·b2b·courseInquiry·eventSignup·newsletter 이동
- [ ] `cdk synth` 산출물에서 stateful 변경 0 확인
- [ ] dev 배포 + 라우트 응답 확인(특히 Deployment 반영)
- [ ] ContentStack 추출·검증
- [ ] SiteBuilderStack 추출·검증
- [ ] 부모 리소스 수 < 400 확인(충분한 여유)
