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
import { stageName } from "./constants";

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
            s3.HttpMethods.PUT,
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
        },
      ],
      /*      autoDeleteObjects: true,
     removalPolicy: RemovalPolicy.DESTROY, */
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
        deployOptions: {
          stageName: stageName,
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
