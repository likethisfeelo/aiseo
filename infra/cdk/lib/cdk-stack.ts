import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'node:path';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const uploadBucketName =
      this.node.tryGetContext('uploadBucketName') ?? process.env.UPLOAD_BUCKET ?? 'aiseo-upload-bucket';
    const reportsTableName =
      this.node.tryGetContext('reportsTableName') ?? process.env.REPORTS_TABLE ?? 'aiseo-reports';
    const sitesBucketName =
      this.node.tryGetContext('sitesBucketName') ?? process.env.SITES_BUCKET ?? 'aiseo-sites-bucket';
    const sitesBucketDevName =
      this.node.tryGetContext('sitesBucketDevName') ?? process.env.SITES_BUCKET_DEV ?? 'aiseo-sites-dev-bucket';

    const devOrigin = this.node.tryGetContext('devOrigin') ?? process.env.DEV_ORIGIN ?? 'https://dev.aiseo.tips';
    const prodOrigin = this.node.tryGetContext('prodOrigin') ?? process.env.PROD_ORIGIN ?? 'https://aiseo.tips';
    const siteDevOrigin = 'https://site.dev.aiseo.tips';
    const siteProdOrigin = 'https://site.aiseo.tips';
    const b2bDevOrigin = 'https://b2b.dev.aiseo.tips';
    const b2bProdOrigin = 'https://b2b.aiseo.tips';

    const userPoolArn = this.node.tryGetContext('cognitoUserPoolArn') ?? process.env.COGNITO_USER_POOL_ARN;

    const uploadBucket = s3.Bucket.fromBucketName(this, 'UploadBucket', uploadBucketName);
    const sitesBucket = s3.Bucket.fromBucketName(this, 'SitesBucket', sitesBucketName);
    const sitesBucketDev = s3.Bucket.fromBucketName(this, 'SitesBucketDev', sitesBucketDevName);
    const reportsTable = dynamodb.Table.fromTableName(this, 'ReportsTable', reportsTableName);

    const functionsRoot = path.resolve(__dirname, '../../../backend/functions');

    // ── Quota policy infrastructure ──
    // Two new tables back the admin-configurable quota system:
    //   1. aiseo-app-config  — single row holding the current policy doc
    //   2. aiseo-user-usage  — per-user running counters (storage, month)
    // Plus a set of HARD_CAP_* env vars that bound any admin-configurable
    // policy so a misconfiguration can't silently bypass our budget.
    const appConfigTableName =
      this.node.tryGetContext('appConfigTableName') ?? 'aiseo-app-config';
    const userUsageTableName =
      this.node.tryGetContext('userUsageTableName') ?? 'aiseo-user-usage';

    const appConfigTable = new dynamodb.Table(this, 'AppConfigTable', {
      tableName: appConfigTableName,
      partitionKey: { name: 'configKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const userUsageTable = new dynamodb.Table(this, 'UserUsageTable', {
      tableName: userUsageTableName,
      partitionKey: { name: 'userSub', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Shared env block applied to every Lambda that needs quota info.
    const quotaEnv = {
      APP_CONFIG_TABLE: appConfigTableName,
      USER_USAGE_TABLE: userUsageTableName,
      HARD_CAP_IMAGE_MB: process.env.HARD_CAP_IMAGE_MB ?? '20',
      HARD_CAP_STORAGE_GB: process.env.HARD_CAP_STORAGE_GB ?? '8',
      HARD_CAP_SITE_ZIP_MB: process.env.HARD_CAP_SITE_ZIP_MB ?? '600',
    };

    const uploadHandler = new lambda.Function(this, 'UploadHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'upload-handler/handler.handler',
      timeout: Duration.seconds(30),
      environment: {
        UPLOAD_BUCKET: uploadBucketName,
        SITES_TABLE: this.node.tryGetContext('sitesTableName') ?? process.env.SITES_TABLE ?? 'aiseo-sites',
        MAX_UPLOAD_BYTES: '52428800',
        ...quotaEnv,
      },
    });
    appConfigTable.grantReadData(uploadHandler);
    userUsageTable.grantReadData(uploadHandler);

    const validateSite = new lambda.Function(this, 'ValidateSiteFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'validate-site/handler.handler',
      timeout: Duration.seconds(30),
      environment: {
        REPORTS_TABLE: reportsTableName,
        UPLOAD_BUCKET: uploadBucketName,
        SITES_TABLE: this.node.tryGetContext('sitesTableName') ?? process.env.SITES_TABLE ?? 'aiseo-sites',
      },
    });

    const deploySite = new lambda.Function(this, 'DeploySiteFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'deploy-site/handler.handler',
      timeout: Duration.seconds(60),
      environment: {
        UPLOAD_BUCKET: uploadBucketName,
        SITES_TABLE: this.node.tryGetContext('sitesTableName') ?? process.env.SITES_TABLE ?? 'aiseo-sites',
        SITES_BUCKET: sitesBucketName,
        SITES_BUCKET_DEV: sitesBucketDevName,
        DISTRIBUTION_ID: process.env.DISTRIBUTION_ID ?? '',
        DISTRIBUTION_ID_DEV: process.env.DISTRIBUTION_ID_DEV ?? '',
        BASE_DOMAIN: process.env.BASE_DOMAIN ?? 'aiseo.tips',
        DEV_DOMAIN: process.env.DEV_DOMAIN ?? 'dev.aiseo.tips',
        ...quotaEnv,
      },
    });
    userUsageTable.grantReadWriteData(deploySite);

    const selectSite = new lambda.Function(this, 'SelectSiteFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'select-site/handler.handler',
      timeout: Duration.seconds(10),
      environment: {
        SITES_TABLE: this.node.tryGetContext('sitesTableName') ?? process.env.SITES_TABLE ?? 'aiseo-sites',
      },
    });

    uploadBucket.grantPut(uploadHandler);
    reportsTable.grantReadWriteData(validateSite);
    uploadBucket.grantRead(validateSite);
    const sitesTable = dynamodb.Table.fromTableName(
      this,
      'SitesTable',
      this.node.tryGetContext('sitesTableName') ?? process.env.SITES_TABLE ?? 'aiseo-sites',
    );
    sitesTable.grantReadData(uploadHandler);
    sitesTable.grantReadData(validateSite);
    sitesTable.grantReadData(deploySite);
    sitesTable.grantReadWriteData(selectSite);

    uploadBucket.grantRead(deploySite);
    sitesBucket.grantReadWrite(deploySite);
    sitesBucketDev.grantReadWrite(deploySite);

    deploySite.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [
        `arn:aws:cloudfront::${this.account}:distribution/${process.env.DISTRIBUTION_ID ?? ''}`,
        `arn:aws:cloudfront::${this.account}:distribution/${process.env.DISTRIBUTION_ID_DEV ?? ''}`,
      ],
    }));

    const api = new apigateway.RestApi(this, 'AiseoApi', {
      restApiName: 'aiseo-api',
      description: 'AISEO API for upload/validate/deploy flow',
      deploy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: [devOrigin, prodOrigin, siteDevOrigin, siteProdOrigin, b2bDevOrigin, b2bProdOrigin],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    let authorizer: apigateway.CognitoUserPoolsAuthorizer | undefined;
    let userPool: cognito.IUserPool | undefined;

    if (userPoolArn) {
      userPool = cognito.UserPool.fromUserPoolArn(this, 'AiseoUserPool', userPoolArn);
      authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiCognitoAuthorizer', {
        cognitoUserPools: [userPool],
      });
    }

    // ── New Lambda functions for brand/products/services/store/image-upload ──
    const sitesTableName = this.node.tryGetContext('sitesTableName') ?? process.env.SITES_TABLE ?? 'aiseo-sites';
    const imagesBucketName = this.node.tryGetContext('imagesBucketName') ?? 'aiseo-images-bucket';
    const imagesCdnDomain = this.node.tryGetContext('imagesCdnDomain') ?? '';

    const imagesBucket = s3.Bucket.fromBucketName(this, 'ImagesBucket', imagesBucketName);

    const brandHandler = new lambda.Function(this, 'BrandHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'brand-handler/handler.handler',
      timeout: Duration.seconds(10),
      environment: { SITES_TABLE: sitesTableName },
    });
    sitesTable.grantReadWriteData(brandHandler);

    const productsHandler = new lambda.Function(this, 'ProductsHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'products-handler/handler.handler',
      timeout: Duration.seconds(10),
      environment: { SITES_TABLE: sitesTableName },
    });
    sitesTable.grantReadWriteData(productsHandler);

    const servicesHandler = new lambda.Function(this, 'ServicesHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'services-handler/handler.handler',
      timeout: Duration.seconds(10),
      environment: { SITES_TABLE: sitesTableName },
    });
    sitesTable.grantReadWriteData(servicesHandler);

    const storeHandler = new lambda.Function(this, 'StoreHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'store-handler/handler.handler',
      timeout: Duration.seconds(10),
      environment: { SITES_TABLE: sitesTableName },
    });
    sitesTable.grantReadWriteData(storeHandler);

    const seoSnapshotHandler = new lambda.Function(this, 'SeoSnapshotHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'seo-snapshot/handler.handler',
      timeout: Duration.seconds(10),
      environment: { SITES_TABLE: sitesTableName },
    });
    sitesTable.grantReadWriteData(seoSnapshotHandler);

    const seoAutoCheckHandler = new lambda.Function(this, 'SeoAutoCheckFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'seo-auto-check/handler.handler',
      timeout: Duration.seconds(30),
      environment: {
        SITES_TABLE: sitesTableName,
        NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ?? '',
        NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ?? '',
        GOOGLE_CSE_API_KEY: process.env.GOOGLE_CSE_API_KEY ?? '',
        GOOGLE_CSE_ENGINE_ID: process.env.GOOGLE_CSE_ENGINE_ID ?? '',
      },
    });
    sitesTable.grantReadWriteData(seoAutoCheckHandler);

    const domainChangeHandler = new lambda.Function(this, 'DomainChangeHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'domain-change/handler.handler',
      timeout: Duration.seconds(10),
      environment: { SITES_TABLE: sitesTableName },
    });
    sitesTable.grantReadWriteData(domainChangeHandler);

    const imageUploadHandler = new lambda.Function(this, 'ImageUploadHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'image-upload-handler/handler.handler',
      timeout: Duration.seconds(30),
      environment: {
        SITES_TABLE: sitesTableName,
        IMAGES_BUCKET: imagesBucketName,
        IMAGES_CDN_DOMAIN: imagesCdnDomain,
        ...quotaEnv,
      },
    });
    sitesTable.grantReadData(imageUploadHandler);
    imagesBucket.grantPut(imageUploadHandler);
    appConfigTable.grantReadData(imageUploadHandler);
    userUsageTable.grantReadWriteData(imageUploadHandler);

    // ── Admin quota policy handler (GET/PUT /admin/quota-policy) ──
    const adminQuotaPolicyHandler = new lambda.Function(this, 'AdminQuotaPolicyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'admin-quota-policy/handler.handler',
      timeout: Duration.seconds(10),
      environment: { ...quotaEnv },
    });
    appConfigTable.grantReadWriteData(adminQuotaPolicyHandler);

    // ── Quota status handler (GET /quota/status) ──
    // Any authenticated user can read their own effective policy + usage.
    const quotaStatusHandler = new lambda.Function(this, 'QuotaStatusFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'quota-status/handler.handler',
      timeout: Duration.seconds(10),
      environment: { ...quotaEnv },
    });
    appConfigTable.grantReadData(quotaStatusHandler);
    userUsageTable.grantReadData(quotaStatusHandler);

    const addPost = (resource: apigateway.Resource, integration: apigateway.LambdaIntegration) => {
      resource.addMethod('POST', integration, {
        authorizationType: authorizer ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE,
        authorizer,
      });
    };

    const addGet = (resource: apigateway.Resource, integration: apigateway.LambdaIntegration) => {
      resource.addMethod('GET', integration, {
        authorizationType: authorizer ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE,
        authorizer,
      });
    };

    const addPut = (resource: apigateway.Resource, integration: apigateway.LambdaIntegration) => {
      resource.addMethod('PUT', integration, {
        authorizationType: authorizer ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE,
        authorizer,
      });
    };

    const addDelete = (resource: apigateway.Resource, integration: apigateway.LambdaIntegration) => {
      resource.addMethod('DELETE', integration, {
        authorizationType: authorizer ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE,
        authorizer,
      });
    };

    const addPublicGet = (resource: apigateway.Resource, integration: apigateway.LambdaIntegration) => {
      resource.addMethod('GET', integration, {
        authorizationType: apigateway.AuthorizationType.NONE,
      });
    };

    const uploadUrl = api.root.addResource('upload-url');
    addPost(uploadUrl, new apigateway.LambdaIntegration(uploadHandler));

    const validate = api.root.addResource('validate');
    addPost(validate, new apigateway.LambdaIntegration(validateSite));

    const deploy = api.root.addResource('deploy');
    addPost(deploy, new apigateway.LambdaIntegration(deploySite));

    const meHandler = new lambda.Function(this, 'MeFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'me/handler.handler',
      timeout: Duration.seconds(10),
      environment: { SITES_TABLE: sitesTableName },
    });
    sitesTable.grantReadData(meHandler);

    const me = api.root.addResource('me');
    addGet(me, new apigateway.LambdaIntegration(meHandler));

    const siteSettingsHandler = new lambda.Function(this, 'SiteSettingsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'site-settings/handler.handler',
      timeout: Duration.seconds(10),
      environment: {
        SITES_TABLE: this.node.tryGetContext('sitesTableName') ?? process.env.SITES_TABLE ?? 'aiseo-sites',
      },
    });
    sitesTable.grantReadWriteData(siteSettingsHandler);

    const site = api.root.addResource('site');
    const siteSelect = site.addResource('select');
    addPost(siteSelect, new apigateway.LambdaIntegration(selectSite));

    const siteSettings = site.addResource('settings');
    const siteSettingsIntegration = new apigateway.LambdaIntegration(siteSettingsHandler);
    addGet(siteSettings, siteSettingsIntegration);
    addPost(siteSettings, siteSettingsIntegration);

    // ── Brand/Products/Services/Store/Image-Upload routes ──
    const brandResource = api.root.addResource('brand');
    const brandIntegration = new apigateway.LambdaIntegration(brandHandler);
    addGet(brandResource, brandIntegration);
    addPost(brandResource, brandIntegration);

    const productsResource = api.root.addResource('products');
    const productsIntegration = new apigateway.LambdaIntegration(productsHandler);
    addGet(productsResource, productsIntegration);
    addPost(productsResource, productsIntegration);
    const productsDelete = productsResource.addResource('delete');
    addPost(productsDelete, productsIntegration);

    const servicesResource = api.root.addResource('services');
    const servicesIntegration = new apigateway.LambdaIntegration(servicesHandler);
    addGet(servicesResource, servicesIntegration);
    addPost(servicesResource, servicesIntegration);
    const servicesDelete = servicesResource.addResource('delete');
    addPost(servicesDelete, servicesIntegration);

    const storeResource = api.root.addResource('store');
    const storeIntegration = new apigateway.LambdaIntegration(storeHandler);
    addGet(storeResource, storeIntegration);
    addPost(storeResource, storeIntegration);

    const seoSnapshotsResource = api.root.addResource('seo-snapshots');
    const seoSnapshotsIntegration = new apigateway.LambdaIntegration(seoSnapshotHandler);
    addGet(seoSnapshotsResource, seoSnapshotsIntegration);
    addPost(seoSnapshotsResource, seoSnapshotsIntegration);
    const seoSnapshotsDeleteResource = seoSnapshotsResource.addResource('delete');
    addPost(seoSnapshotsDeleteResource, seoSnapshotsIntegration);
    const seoAutoCheckResource = seoSnapshotsResource.addResource('auto-check');
    addPost(seoAutoCheckResource, new apigateway.LambdaIntegration(seoAutoCheckHandler));

    const domainChangeResource = api.root.addResource('domain-change');
    const domainChangeIntegration = new apigateway.LambdaIntegration(domainChangeHandler);
    addGet(domainChangeResource, domainChangeIntegration);
    addPost(domainChangeResource, domainChangeIntegration);
    const domainChangeAdminResource = domainChangeResource.addResource('admin');
    addGet(domainChangeAdminResource, domainChangeIntegration);
    const domainChangeApproveResource = domainChangeAdminResource.addResource('approve');
    addPost(domainChangeApproveResource, domainChangeIntegration);
    const domainChangeRejectResource = domainChangeAdminResource.addResource('reject');
    addPost(domainChangeRejectResource, domainChangeIntegration);
    const domainChangeDeactivateResource = domainChangeAdminResource.addResource('deactivate');
    addPost(domainChangeDeactivateResource, domainChangeIntegration);

    const imageUploadResource = api.root.addResource('image-upload');
    addPost(imageUploadResource, new apigateway.LambdaIntegration(imageUploadHandler));

    // Quota status (authenticated user) — /quota/status
    const quotaResource = api.root.addResource('quota');
    const quotaStatusResource = quotaResource.addResource('status');
    addGet(quotaStatusResource, new apigateway.LambdaIntegration(quotaStatusHandler));

    // ── Consultations table + Lambda ──
    const consultationsTableName = 'aiseo-consultations';
    const consultationsTable = new dynamodb.Table(this, 'ConsultationsTable', {
      tableName: consultationsTableName,
      partitionKey: { name: 'consultationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const consultationHandler = new lambda.Function(this, 'ConsultationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'consultation/handler.handler',
      timeout: Duration.seconds(10),
      environment: {
        CONSULTATIONS_TABLE: consultationsTableName,
        SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? '',
      },
    });
    consultationsTable.grantReadWriteData(consultationHandler);

    // ── B2B consultations table + Lambda ──
    const b2bConsultationsTableName = 'aiseo-b2b-consultations';
    const b2bConsultationsTable = new dynamodb.Table(this, 'B2BConsultationsTable', {
      tableName: b2bConsultationsTableName,
      partitionKey: { name: 'b2bConsultationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const b2bConsultationHandler = new lambda.Function(this, 'B2BConsultationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'b2b-consultation/handler.handler',
      timeout: Duration.seconds(10),
      environment: {
        B2B_CONSULTATIONS_TABLE: b2bConsultationsTableName,
        SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? '',
      },
    });
    b2bConsultationsTable.grantReadWriteData(b2bConsultationHandler);

    // ── Course inquiries table + Lambda ──
    const courseInquiriesTableName = 'aiseo-course-inquiries';
    const courseInquiriesTable = new dynamodb.Table(this, 'CourseInquiriesTable', {
      tableName: courseInquiriesTableName,
      partitionKey: { name: 'inquiryId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const courseInquiryHandler = new lambda.Function(this, 'CourseInquiryFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'course-inquiry/handler.handler',
      timeout: Duration.seconds(10),
      environment: {
        COURSE_INQUIRIES_TABLE: courseInquiriesTableName,
        SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? '',
      },
    });
    courseInquiriesTable.grantReadWriteData(courseInquiryHandler);

    // ── Event signups table + Lambda (events 2026: free/paid 패키지 신청) ──
    const eventSignupsTableName = 'aiseo-event-signups';
    const eventSignupsTable = new dynamodb.Table(this, 'EventSignupsTable', {
      tableName: eventSignupsTableName,
      partitionKey: { name: 'signupId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    eventSignupsTable.addGlobalSecondaryIndex({
      indexName: 'eventCode-createdAt-index',
      partitionKey: { name: 'eventCode', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const eventSignupHandler = new lambda.Function(this, 'EventSignupFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'event-signup/handler.handler',
      timeout: Duration.seconds(10),
      environment: {
        EVENT_SIGNUPS_TABLE: eventSignupsTableName,
        SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? '',
      },
    });
    eventSignupsTable.grantReadWriteData(eventSignupHandler);

    // ── Newsletter subscribers table + Lambda ──
    const newsletterTableName = 'aiseo-newsletter-subscribers';
    const newsletterTable = new dynamodb.Table(this, 'NewsletterSubscribersTable', {
      tableName: newsletterTableName,
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const newsletterHandler = new lambda.Function(this, 'NewsletterFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'newsletter/handler.handler',
      timeout: Duration.seconds(10),
      environment: {
        NEWSLETTER_TABLE: newsletterTableName,
      },
    });
    newsletterTable.grantReadWriteData(newsletterHandler);

    // ── Admin users (Cognito group management) Lambda ──
    const adminUsersHandler = new lambda.Function(this, 'AdminUsersFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'admin-users/handler.handler',
      timeout: Duration.seconds(15),
      environment: {
        USER_POOL_ID: userPool ? userPool.userPoolId : '',
      },
    });
    if (userPool) {
      adminUsersHandler.addToRolePolicy(new iam.PolicyStatement({
        actions: [
          'cognito-idp:ListUsers',
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:AdminGetUser',
        ],
        resources: [userPool.userPoolArn],
      }));
    }

    // ── Auth post-confirmation Lambda (가입 확정 시 community 그룹 자동 부여) ──
    // 풀은 ARN import 라 CDK L2 가 자체적으로 트리거를 attach 할 수 없음.
    // 배포 후 Cognito 콘솔에서 "User pool properties → Lambda triggers →
    // Post confirmation" 으로 이 함수를 한 번 수동 attach. (docs/membership-260602.md §6)
    const authPostConfirmationHandler = new lambda.Function(this, 'AuthPostConfirmationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'auth-post-confirmation/handler.handler',
      timeout: Duration.seconds(10),
    });
    if (userPool) {
      authPostConfirmationHandler.addToRolePolicy(new iam.PolicyStatement({
        actions: ['cognito-idp:AdminAddUserToGroup'],
        resources: [userPool.userPoolArn],
      }));
      // Cognito 가 이 Lambda 를 호출할 수 있도록 resource policy 사전 부여.
      // 콘솔에서 트리거를 붙일 때 자동 부여되기도 하지만 명시적으로 두면
      // 트리거 재설정·풀 마이그레이션 시에도 안전.
      authPostConfirmationHandler.addPermission('AllowCognitoInvoke', {
        principal: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
        sourceArn: userPool.userPoolArn,
      });
    }

    // ── Blog tables + Lambda ──
    const blogPostsTableName = 'aiseo-blog-posts';
    const blogPostsTable = new dynamodb.Table(this, 'BlogPostsTable', {
      tableName: blogPostsTableName,
      partitionKey: { name: 'slug', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const blogCategoriesTableName = 'aiseo-blog-categories';
    const blogCategoriesTable = new dynamodb.Table(this, 'BlogCategoriesTable', {
      tableName: blogCategoriesTableName,
      partitionKey: { name: 'slug', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const blogHandler = new lambda.Function(this, 'BlogFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'blog/handler.handler',
      // Bumped from 10s because admin create/update now runs a
      // prerender cycle (S3 GET template + S3 PUT snapshot + CF
      // invalidation) against both dev and prod targets.
      timeout: Duration.seconds(30),
      environment: {
        BLOG_POSTS_TABLE: blogPostsTableName,
        BLOG_CATEGORIES_TABLE: blogCategoriesTableName,
        // Prerender targets — the blog Lambda writes per-post
        // HTML snapshots to these buckets whenever an admin
        // creates/updates/deletes a post, so Kakao/FB/X/Naver
        // crawlers see per-post OG tags. See
        // backend/functions/blog/prerender.js.
        SITES_BUCKET: sitesBucketName,
        SITES_BUCKET_DEV: sitesBucketDevName,
        DISTRIBUTION_ID: process.env.DISTRIBUTION_ID ?? '',
        DISTRIBUTION_ID_DEV: process.env.DISTRIBUTION_ID_DEV ?? '',
        BLOG_BASE_URL: process.env.BLOG_BASE_URL ?? 'https://site.dev.aiseo.tips',
      },
    });
    blogPostsTable.grantReadWriteData(blogHandler);
    blogCategoriesTable.grantReadWriteData(blogHandler);

    // The blog Lambda needs to read the SPA template
    // (`site/index.html`) and write prerendered blog snapshots
    // (`site/blog/<slug>/index.html`) to both environments.
    // Scope grants to the `site/*` prefix so we don't leak
    // write access to user site buckets.
    sitesBucket.grantReadWrite(blogHandler, 'site/*');
    sitesBucketDev.grantReadWrite(blogHandler, 'site/*');

    blogHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [
        `arn:aws:cloudfront::${this.account}:distribution/${process.env.DISTRIBUTION_ID ?? ''}`,
        `arn:aws:cloudfront::${this.account}:distribution/${process.env.DISTRIBUTION_ID_DEV ?? ''}`,
      ],
    }));

    // ── AI SEO Library — covers + posts + cover↔post join ──
    // See backend/functions/library/handler.js for the route map.
    const libraryCoversTableName = 'aiseo-library-covers';
    const libraryCoversTable = new dynamodb.Table(this, 'LibraryCoversTable', {
      tableName: libraryCoversTableName,
      partitionKey: { name: 'slug', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const libraryPostsTableName = 'aiseo-library-posts';
    const libraryPostsTable = new dynamodb.Table(this, 'LibraryPostsTable', {
      tableName: libraryPostsTableName,
      partitionKey: { name: 'slug', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const libraryCoverPostsTableName = 'aiseo-library-cover-posts';
    const libraryCoverPostsTable = new dynamodb.Table(this, 'LibraryCoverPostsTable', {
      tableName: libraryCoverPostsTableName,
      // PK = coverSlug, SK = `${pad4(order)}#${postSlug}` so a Query
      // by coverSlug returns chapters already sorted by SK.
      partitionKey: { name: 'coverSlug', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    // Inverse lookup — "어떤 표지들에 이 포스트가 들어있는가" for the
    // admin post-edit page and cascade-delete on post removal.
    libraryCoverPostsTable.addGlobalSecondaryIndex({
      indexName: 'postSlug-index',
      partitionKey: { name: 'postSlug', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 감사 로그 — admin 의 모든 표지/포스트 mutation 기록.
    // PK='audit' 고정 (단일 partition, 라이브러리 규모상 hot 되지 않음).
    // SK=`{nowIso}#{uuid}` 로 시간 역순 조회 쉬움.
    const libraryAuditTableName = 'aiseo-library-audit';
    const libraryAuditTable = new dynamodb.Table(this, 'LibraryAuditTable', {
      tableName: libraryAuditTableName,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const libraryHandler = new lambda.Function(this, 'LibraryFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'library/handler.handler',
      timeout: Duration.seconds(30),
      environment: {
        LIBRARY_COVERS_TABLE: libraryCoversTableName,
        LIBRARY_POSTS_TABLE: libraryPostsTableName,
        LIBRARY_COVER_POSTS_TABLE: libraryCoverPostsTableName,
        LIBRARY_AUDIT_TABLE: libraryAuditTableName,
      },
    });
    libraryCoversTable.grantReadWriteData(libraryHandler);
    libraryPostsTable.grantReadWriteData(libraryHandler);
    libraryCoverPostsTable.grantReadWriteData(libraryHandler);
    libraryAuditTable.grantReadWriteData(libraryHandler);

    // ── Comments table + Lambda handlers ──
    const commentsTableName = this.node.tryGetContext('commentsTableName') ?? 'aiseo-comments';
    const commentsTable = new dynamodb.Table(this, 'CommentsTable', {
      tableName: commentsTableName,
      partitionKey: { name: 'siteId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'commentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const adminSitesHandler = new lambda.Function(this, 'AdminSitesFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'admin-sites/handler.handler',
      timeout: Duration.seconds(10),
      environment: { SITES_TABLE: sitesTableName },
    });
    sitesTable.grantReadData(adminSitesHandler);

    const adminCommentHandler = new lambda.Function(this, 'AdminCommentFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'admin-comment/handler.handler',
      timeout: Duration.seconds(10),
      environment: { COMMENTS_TABLE: commentsTableName },
    });
    commentsTable.grantWriteData(adminCommentHandler);

    const commentsHandler = new lambda.Function(this, 'CommentsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'comments/handler.handler',
      timeout: Duration.seconds(10),
      environment: { COMMENTS_TABLE: commentsTableName, SITES_TABLE: sitesTableName },
    });
    commentsTable.grantReadWriteData(commentsHandler);
    sitesTable.grantReadData(commentsHandler);

    // Admin API routes
    const adminResource = api.root.addResource('admin');
    const adminSitesResource = adminResource.addResource('sites');
    addGet(adminSitesResource, new apigateway.LambdaIntegration(adminSitesHandler));
    const adminSiteResource = adminResource.addResource('site');
    addGet(adminSiteResource, new apigateway.LambdaIntegration(adminSitesHandler));
    const adminCommentResource = adminResource.addResource('comment');
    addPost(adminCommentResource, new apigateway.LambdaIntegration(adminCommentHandler));

    // User comments routes
    const commentsResource = api.root.addResource('comments');
    const commentsIntegration = new apigateway.LambdaIntegration(commentsHandler);
    addGet(commentsResource, commentsIntegration);
    const commentsReadResource = commentsResource.addResource('read');
    addPost(commentsReadResource, commentsIntegration);

    // Consultation routes
    const consultationIntegration = new apigateway.LambdaIntegration(consultationHandler);
    const consultationResource = api.root.addResource('consultation', {
      defaultCorsPreflightOptions: {
        allowOrigins: [devOrigin, prodOrigin, siteDevOrigin, siteProdOrigin, b2bDevOrigin, b2bProdOrigin],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    consultationResource.addMethod('POST', consultationIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const adminConsultationsResource = adminResource.addResource('consultations');
    addGet(adminConsultationsResource, consultationIntegration);

    // B2B consultation routes
    const b2bConsultationIntegration = new apigateway.LambdaIntegration(b2bConsultationHandler);
    const b2bConsultationResource = api.root.addResource('b2b-consultation', {
      defaultCorsPreflightOptions: {
        allowOrigins: [devOrigin, prodOrigin, siteDevOrigin, siteProdOrigin, b2bDevOrigin, b2bProdOrigin],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    b2bConsultationResource.addMethod('POST', b2bConsultationIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const adminB2BConsultationsResource = adminResource.addResource('b2b-consultations');
    addGet(adminB2BConsultationsResource, b2bConsultationIntegration);

    // Admin quota policy — /admin/quota-policy (GET+PUT)
    const adminQuotaPolicyResource = adminResource.addResource('quota-policy');
    const adminQuotaPolicyIntegration = new apigateway.LambdaIntegration(adminQuotaPolicyHandler);
    addGet(adminQuotaPolicyResource, adminQuotaPolicyIntegration);
    addPut(adminQuotaPolicyResource, adminQuotaPolicyIntegration);

    // Course inquiry routes
    const courseInquiryIntegration = new apigateway.LambdaIntegration(courseInquiryHandler);
    const courseInquiryResource = api.root.addResource('course-inquiry', {
      defaultCorsPreflightOptions: {
        allowOrigins: [devOrigin, prodOrigin, siteDevOrigin, siteProdOrigin, b2bDevOrigin, b2bProdOrigin],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    courseInquiryResource.addMethod('POST', courseInquiryIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const adminCourseInquiriesResource = adminResource.addResource('course-inquiries');
    addGet(adminCourseInquiriesResource, courseInquiryIntegration);

    // Event signup routes (events 2026: free/paid)
    const eventSignupIntegration = new apigateway.LambdaIntegration(eventSignupHandler);
    const eventSignupResource = api.root.addResource('event-signup', {
      defaultCorsPreflightOptions: {
        allowOrigins: [devOrigin, prodOrigin, siteDevOrigin, siteProdOrigin, b2bDevOrigin, b2bProdOrigin],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    eventSignupResource.addMethod('POST', eventSignupIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const adminEventSignupsResource = adminResource.addResource('event-signups');
    addGet(adminEventSignupsResource, eventSignupIntegration);

    // Newsletter routes
    const newsletterIntegration = new apigateway.LambdaIntegration(newsletterHandler);
    const newsletterResource = api.root.addResource('newsletter', {
      defaultCorsPreflightOptions: {
        allowOrigins: [devOrigin, prodOrigin, siteDevOrigin, siteProdOrigin, b2bDevOrigin, b2bProdOrigin],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    const newsletterSubscribeResource = newsletterResource.addResource('subscribe');
    newsletterSubscribeResource.addMethod('POST', newsletterIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const adminNewsletterResource = adminResource.addResource('newsletter-subscribers');
    addGet(adminNewsletterResource, newsletterIntegration);

    // Admin users (Cognito group management)
    const adminUsersIntegration = new apigateway.LambdaIntegration(adminUsersHandler);
    const adminUsersResource = adminResource.addResource('users');
    addGet(adminUsersResource, adminUsersIntegration);
    const adminUsersGrantResource = adminUsersResource.addResource('grant');
    addPost(adminUsersGrantResource, adminUsersIntegration);
    const adminUsersRevokeResource = adminUsersResource.addResource('revoke');
    addPost(adminUsersRevokeResource, adminUsersIntegration);

    // ── Blog routes ──
    const blogIntegration = new apigateway.LambdaIntegration(blogHandler);

    // Public blog routes (auth NONE) — /blog/*
    const blogResource = api.root.addResource('blog');
    const blogPostsResource = blogResource.addResource('posts');
    addPublicGet(blogPostsResource, blogIntegration);
    const blogPostSlugResource = blogPostsResource.addResource('{slug}');
    addPublicGet(blogPostSlugResource, blogIntegration);
    const blogFeaturedResource = blogResource.addResource('featured');
    addPublicGet(blogFeaturedResource, blogIntegration);
    const blogPopularResource = blogResource.addResource('popular');
    addPublicGet(blogPopularResource, blogIntegration);
    const blogCategoriesResource = blogResource.addResource('categories');
    addPublicGet(blogCategoriesResource, blogIntegration);

    // Admin blog routes (Cognito admin) — /admin/blog/*
    const adminBlogResource = adminResource.addResource('blog');

    const adminBlogPostsResource = adminBlogResource.addResource('posts');
    addGet(adminBlogPostsResource, blogIntegration);
    addPost(adminBlogPostsResource, blogIntegration);
    const adminBlogPostSlugResource = adminBlogPostsResource.addResource('{slug}');
    addGet(adminBlogPostSlugResource, blogIntegration);
    addPut(adminBlogPostSlugResource, blogIntegration);
    addDelete(adminBlogPostSlugResource, blogIntegration);

    const adminBlogCategoriesResource = adminBlogResource.addResource('categories');
    addGet(adminBlogCategoriesResource, blogIntegration);
    addPost(adminBlogCategoriesResource, blogIntegration);
    const adminBlogCategorySlugResource = adminBlogCategoriesResource.addResource('{slug}');
    addPut(adminBlogCategorySlugResource, blogIntegration);
    addDelete(adminBlogCategorySlugResource, blogIntegration);

    // ── AI SEO Library routes ──
    const libraryIntegration = new apigateway.LambdaIntegration(libraryHandler);

    // Public — /library/covers, /library/covers/{slug}, /library/posts/{slug}
    const libraryResource = api.root.addResource('library');
    const libraryCoversResource = libraryResource.addResource('covers');
    addPublicGet(libraryCoversResource, libraryIntegration);
    const libraryCoverSlugResource = libraryCoversResource.addResource('{slug}');
    addPublicGet(libraryCoverSlugResource, libraryIntegration);
    const libraryPostsResource = libraryResource.addResource('posts');
    const libraryPostSlugResource = libraryPostsResource.addResource('{slug}');
    addPublicGet(libraryPostSlugResource, libraryIntegration);

    // Admin — /admin/library/covers, /admin/library/posts (+ /chapters bulk reorder)
    const adminLibraryResource = adminResource.addResource('library');
    const adminLibraryCoversResource = adminLibraryResource.addResource('covers');
    addGet(adminLibraryCoversResource, libraryIntegration);
    addPost(adminLibraryCoversResource, libraryIntegration);
    const adminLibraryCoverSlugResource = adminLibraryCoversResource.addResource('{slug}');
    addGet(adminLibraryCoverSlugResource, libraryIntegration);
    addPut(adminLibraryCoverSlugResource, libraryIntegration);
    addDelete(adminLibraryCoverSlugResource, libraryIntegration);
    const adminLibraryCoverChaptersResource = adminLibraryCoverSlugResource.addResource('chapters');
    addPut(adminLibraryCoverChaptersResource, libraryIntegration);

    const adminLibraryPostsResource = adminLibraryResource.addResource('posts');
    addGet(adminLibraryPostsResource, libraryIntegration);
    addPost(adminLibraryPostsResource, libraryIntegration);
    const adminLibraryPostSlugResource = adminLibraryPostsResource.addResource('{slug}');
    addGet(adminLibraryPostSlugResource, libraryIntegration);
    addPut(adminLibraryPostSlugResource, libraryIntegration);
    addDelete(adminLibraryPostSlugResource, libraryIntegration);

    // admin 드래프트 미리보기 — reader 페이지가 비공개 post 도 볼 수 있게.
    const adminLibraryPreviewResource = adminLibraryResource.addResource('preview');
    const adminLibraryPreviewSlugResource = adminLibraryPreviewResource.addResource('{slug}');
    addGet(adminLibraryPreviewSlugResource, libraryIntegration);

    // admin 감사 로그 조회 — 최근 mutation 시간 역순.
    const adminLibraryAuditResource = adminLibraryResource.addResource('audit');
    addGet(adminLibraryAuditResource, libraryIntegration);

    api.addGatewayResponse('Default4xx', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    api.addGatewayResponse('Default5xx', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    const deployment = new apigateway.Deployment(this, 'AiseoApiDeployment', { api });
    // Force redeployment when resources change
    deployment.addToLogicalId(new Date().toISOString());

    // Account-level throttling applied to every route in each stage.
    // Protects us against a runaway client burning through S3 PUT quota
    // while still leaving comfortable headroom for 77 concurrent users.
    const stageThrottling: apigateway.ThrottleSettings = {
      rateLimit: 20,
      burstLimit: 40,
    };

    new apigateway.Stage(this, 'DevApiStage', {
      deployment,
      stageName: 'dev',
      throttlingRateLimit: stageThrottling.rateLimit,
      throttlingBurstLimit: stageThrottling.burstLimit,
    });

    new apigateway.Stage(this, 'ProdApiStage', {
      deployment,
      stageName: 'prod',
      throttlingRateLimit: stageThrottling.rateLimit,
      throttlingBurstLimit: stageThrottling.burstLimit,
    });

    new CfnOutput(this, 'DevApiUrl', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/dev`,
    });

    new CfnOutput(this, 'ProdApiUrl', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/prod`,
    });
  }
}
