import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';

test('API, Lambda and Cognito authorizer resources are created', () => {
  const app = new App({
    context: {
      uploadBucketName: 'aiseo-upload-bucket',
      reportsTableName: 'aiseo-reports',
      sitesTableName: 'aiseo-sites',
      sitesBucketName: 'aiseo-sites-bucket',
      sitesBucketDevName: 'aiseo-sites-dev-bucket',
      cognitoUserPoolArn: 'arn:aws:cognito-idp:ap-northeast-2:123456789012:userpool/ap-northeast-2_example',
      devOrigin: 'https://dev.aiseo.tips',
      prodOrigin: 'https://aiseo.tips',
    },
  });

  const stack = new CdkStack(app, 'TestStack', {
    env: {
      account: '123456789012',
      region: 'ap-northeast-2',
    },
  });

  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::Lambda::Function', 5);
  template.resourceCountIs('AWS::ApiGateway::Resource', 6);
  template.resourceCountIs('AWS::ApiGateway::Authorizer', 1);

  template.hasResourceProperties('AWS::ApiGateway::Stage', {
    StageName: 'dev',
  });

  template.hasResourceProperties('AWS::ApiGateway::Stage', {
    StageName: 'prod',
  });

  template.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'POST',
    AuthorizationType: 'COGNITO_USER_POOLS',
    AuthorizerId: Match.anyValue(),
  });
});
