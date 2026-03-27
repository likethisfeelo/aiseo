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

    const userPoolArn = this.node.tryGetContext('cognitoUserPoolArn') ?? process.env.COGNITO_USER_POOL_ARN;

    const uploadBucket = s3.Bucket.fromBucketName(this, 'UploadBucket', uploadBucketName);
    const sitesBucket = s3.Bucket.fromBucketName(this, 'SitesBucket', sitesBucketName);
    const sitesBucketDev = s3.Bucket.fromBucketName(this, 'SitesBucketDev', sitesBucketDevName);
    const reportsTable = dynamodb.Table.fromTableName(this, 'ReportsTable', reportsTableName);

    const functionsRoot = path.resolve(__dirname, '../../../backend/functions');

    const uploadHandler = new lambda.Function(this, 'UploadHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(functionsRoot),
      handler: 'upload-handler/handler.handler',
      timeout: Duration.seconds(30),
      environment: {
        UPLOAD_BUCKET: uploadBucketName,
        SITES_TABLE: this.node.tryGetContext('sitesTableName') ?? process.env.SITES_TABLE ?? 'aiseo-sites',
        MAX_UPLOAD_BYTES: '52428800',
      },
    });

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
      },
    });

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
        allowOrigins: [devOrigin, prodOrigin],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    let authorizer: apigateway.CognitoUserPoolsAuthorizer | undefined;

    if (userPoolArn) {
      const userPool = cognito.UserPool.fromUserPoolArn(this, 'AiseoUserPool', userPoolArn);
      authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiCognitoAuthorizer', {
        cognitoUserPools: [userPool],
      });
    }

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
    });

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

    api.addGatewayResponse('Default4xx', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
      },
    });

    api.addGatewayResponse('Default5xx', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        'Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
      },
    });

    const deployment = new apigateway.Deployment(this, 'AiseoApiDeployment', { api });

    new apigateway.Stage(this, 'DevApiStage', {
      deployment,
      stageName: 'dev',
    });

    new apigateway.Stage(this, 'ProdApiStage', {
      deployment,
      stageName: 'prod',
    });

    new CfnOutput(this, 'DevApiUrl', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/dev`,
    });

    new CfnOutput(this, 'ProdApiUrl', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/prod`,
    });
  }
}
