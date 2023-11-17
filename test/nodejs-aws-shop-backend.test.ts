import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as NodejsAwsShopBackend from "../lib/nodejs-aws-shop-backend-stack";

// example test. To run these tests, uncomment this file along with the
// example resource in lib/nodejs-aws-shop-backend-stack.ts
test("ApiGateway created", () => {
  const app = new cdk.App();

  const stack = new NodejsAwsShopBackend.NodejsAwsShopBackendStack(
    app,
    "MyTestStack"
  );

  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
    ProtocolType: "HTTP",
  });
});
