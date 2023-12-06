import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importServiceBucket = s3.Bucket.fromBucketName(
      this,
      "ImportServiceBucket",
      "upload-aws-course-egatsak"
    );

    const sharedLambdaProps: NodejsFunctionProps = {
      runtime: Runtime.NODEJS_20_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION ?? "eu-north-1",
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

    importServiceBucket.grantReadWrite(importProductsFileFunction);

    const importsApiGateway = new apiGateway.RestApi(
      this,
      "ImportsApiGateway",
      {
        restApiName: "Import Service",
        defaultCorsPreflightOptions: {
          allowHeaders: ["*"],
          allowOrigins: apiGateway.Cors.ALL_ORIGINS,
          allowMethods: apiGateway.Cors.ALL_METHODS,
        },
      }
    );

    const lambdaIntegration = new apiGateway.LambdaIntegration(
      importProductsFileFunction,
      {
        requestParameters: {
          "integration.request.querystring.name":
            "method.request.querystring.name",
        },
      }
    );

    const resource = importsApiGateway.root.addResource("import");

    resource.addMethod("GET", lambdaIntegration, {
      requestParameters: {
        "method.request.querystring.name": true,
      },
    });

    const importFileParserFunction = new NodejsFunction(
      this,
      "ImportFileParserLambda",
      {
        ...sharedLambdaProps,
        environment: {
          PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION ?? "eu-north-1",
        },
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

    importServiceBucket.grantReadWrite(importFileParserFunction);
  }
}
