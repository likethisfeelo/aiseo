#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new App();

new CdkStack(app, 'CdkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'ap-northeast-2',
  },
});
