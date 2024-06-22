import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import * as s3 from "aws-cdk-lib/aws-s3";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importServiceBucket = new s3.Bucket(this, "ImportServiceS3Bucket", {
      bucketName: "egatsak-import-service-bucket",
      cors: [
        {
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.DELETE,
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          exposedHeaders: [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers",
          ],
        },
      ],
      /*      autoDeleteObjects: true,
     removalPolicy: RemovalPolicy.DESTROY, */
    });

    /* importServiceBucket.addCorsRule({
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
      allowedMethods: [
        s3.HttpMethods.DELETE,
        s3.HttpMethods.GET,
        s3.HttpMethods.HEAD,
        s3.HttpMethods.POST,
        s3.HttpMethods.PUT,
      ],
      exposedHeaders: [
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers",
      ],
    }); */

    const bucketUploadedPolicy = new PolicyStatement({
      actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      resources: [importServiceBucket.arnForObjects(`uploaded/*`)],
      effect: Effect.ALLOW,
    });

    const bucketParsedPolicy = new PolicyStatement({
      actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      resources: [importServiceBucket.arnForObjects(`parsed/*`)],
      effect: Effect.ALLOW,
    });

    const sharedLambdaProps: NodejsFunctionProps = {
      runtime: Runtime.NODEJS_20_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
        BUCKET_NAME: importServiceBucket.bucketName,
      },
    };

    const importProductsFileFunction = new NodejsFunction(
      this,
      "ImportProductsFileLambda",
      {
        ...sharedLambdaProps,
        entry: "lib/handlers/importProductsFile.ts",
        functionName: "importProductsFile",
      }
    );

    importProductsFileFunction.addToRolePolicy(bucketUploadedPolicy);

    importServiceBucket.grantReadWrite(importProductsFileFunction);

    const importsApiGateway = new apiGateway.HttpApi(
      this,
      "ImportsHttpApiGateway",
      {
        apiName: "ImportServiceHttpApi",
        corsPreflight: {
          allowHeaders: ["*"],
          allowOrigins: ["*"],
          allowMethods: [apiGateway.CorsHttpMethod.ANY],
        },
        createDefaultStage: true,
      }
    );

    importsApiGateway.addRoutes({
      integration: new HttpLambdaIntegration(
        "ImportServiceLambdaIntegration",
        importProductsFileFunction
      ),
      path: "/import",
      methods: [apiGateway.HttpMethod.GET],
    });

    const importFileParserFunction = new NodejsFunction(
      this,
      "ImportFileParserLambda",
      {
        ...sharedLambdaProps,
        entry: "lib/handlers/importFileParser.ts",
        functionName: "importFileParser",
      }
    );

    importServiceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserFunction),
      {
        prefix: "uploaded/",
        suffix: "csv",
      }
    );

    importFileParserFunction.addToRolePolicy(bucketParsedPolicy);
    importServiceBucket.grantReadWrite(importFileParserFunction);
  }
}
