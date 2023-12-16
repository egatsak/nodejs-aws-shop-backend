import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime, CfnPermission, Function } from "aws-cdk-lib/aws-lambda";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";
import {
  HttpLambdaAuthorizer,
  HttpLambdaResponseType,
} from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importServiceBucket = s3.Bucket.fromBucketName(
      this,
      "ImportServiceBucket",
      "upload-aws-course-egatsak"
    );

    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "CatalogItemsQueue",
      this.formatArn({
        service: "sqs",
        resource: "CatalogItemsQueue",
      })
    );

    const basicAuthorizer = Function.fromFunctionArn(
      this,
      "basicAuthorizer",
      process.env.AUTHORIZER_FUNCTION_ARN!
    );

    const authorizer = new HttpLambdaAuthorizer("Authorizer", basicAuthorizer, {
      responseTypes: [HttpLambdaResponseType.IAM],
      resultsCacheTtl: cdk.Duration.seconds(0),
    });

    new CfnPermission(this, "MyAuthorizerPermission", {
      action: "lambda:InvokeFunction",
      functionName: basicAuthorizer.functionName,
      principal: "apigateway.amazonaws.com",
    });

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
          allowOrigins: apiGateway.Cors.ALL_ORIGINS,
          allowMethods: apiGateway.Cors.ALL_METHODS,
          allowHeaders: apiGateway.Cors.DEFAULT_HEADERS,
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

    const resource = importsApiGateway.root.addResource("import", {
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
      },
    });

    resource.addMethod("GET", lambdaIntegration, {
      requestParameters: {
        "method.request.querystring.name": true,
      },
      authorizer,
    });

    const importFileParserFunction = new NodejsFunction(
      this,
      "ImportFileParserLambda",
      {
        ...sharedLambdaProps,
        environment: {
          PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION ?? "eu-north-1",
          SQS_NAME: catalogItemsQueue.queueUrl,
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
      }
    );

    catalogItemsQueue.grantSendMessages(importFileParserFunction);
    importServiceBucket.grantReadWrite(importFileParserFunction);
  }
}
