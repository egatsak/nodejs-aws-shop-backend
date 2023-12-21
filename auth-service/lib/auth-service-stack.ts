import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CfnOutput } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export class AuthServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userName = process.env.USER_NAME ?? "";

    const basicAuthorizerFunction = new NodejsFunction(
      this,
      "ImportProductsFileLambda",
      {
        runtime: Runtime.NODEJS_20_X,
        environment: {
          PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION ?? "eu-north-1",
          USERNAME: userName,
          PASSWORD: process.env[userName] ?? "",
        },
        entry: "lib/handlers/basicAuthorizer.ts",
        functionName: "basicAuthorizer",
      }
    );

    new CfnOutput(this, "AuthorizerLambdaArn", {
      value: basicAuthorizerFunction.functionArn,
      exportName: `AuthorizerLambdaArn`,
    });
  }
}
