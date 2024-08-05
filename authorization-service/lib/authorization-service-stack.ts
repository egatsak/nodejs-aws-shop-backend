import * as cdk from "aws-cdk-lib";
import {CfnOutput} from "aws-cdk-lib";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {NodejsFunction, NodejsFunctionProps} from "aws-cdk-lib/aws-lambda-nodejs";
import {Construct} from "constructs";
import {BASIC_AUTHORIZER_LAMBDA_ARN} from "../../constants";

const sharedLambdaProps: NodejsFunctionProps = {
  runtime: Runtime.NODEJS_20_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.AWS_REGION ?? "us-east-1"
  }
};

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicAuthorizerFunction = new NodejsFunction(this, "BasicAuthorizerLambda", {
      ...sharedLambdaProps,
      entry: "lib/handlers/basicAuthorizer.ts",
      functionName: "basicAuthorizer",
      environment: {
        ...sharedLambdaProps.environment,
        egatsak: process.env.egatsak ?? ""
      }
    });

    new CfnOutput(this, "BasicAuthorizerLambdaArn", {
      value: basicAuthorizerFunction.functionArn,
      exportName: BASIC_AUTHORIZER_LAMBDA_ARN
    });
  }
}
