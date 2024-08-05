import * as cdk from 'aws-cdk-lib';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpUrlIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';

const ELASTIC_BEANSTALK_BFF_API_URL =
  process.env.ELASTIC_BEANSTALK_BFF_API_URL ??
  'http://egatsak-bff-api-development.us-east-1.elasticbeanstalk.com';

export class BffGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const httpApi = new HttpApi(this, 'BffApiHttpApi', {
      apiName: 'BffApiHttpApi',
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.ANY],
      },
    });

    const integration = new HttpUrlIntegration(
      'BffApiHttpApiIntegration',
      `${ELASTIC_BEANSTALK_BFF_API_URL}/{proxy}`,
    );

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: integration,
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.apiEndpoint,
    });
  }
}
