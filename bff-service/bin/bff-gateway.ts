#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BffGatewayStack } from '../lib/bff-gateway-stack';

const app = new cdk.App();
new BffGatewayStack(app, 'BffGatewayStack', {
  env: { region: process.env.AWS_REGION ?? 'us-east-1' },
});

app.synth();
