import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpLambdaAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import {
  BASIC_AUTHORIZER_LAMBDA_ARN,
  IMPORT_PRODUCTS_SQS_ARN,
  IMPORT_PRODUCTS_SQS_URL,
} from "../../constants";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Authorizer lambda
    const basicAuthorizerLambdaArn = cdk.Fn.importValue(
      BASIC_AUTHORIZER_LAMBDA_ARN
    );

    const basicAuthorizerLambda = NodejsFunction.fromFunctionArn(
      this,
      "BasicAuthorizerLambda",
      basicAuthorizerLambdaArn
    );

    const tokenAuthorizer = new HttpLambdaAuthorizer(
      "ImportAuthorizer",
      basicAuthorizerLambda,
      {
        authorizerName: "MyLambdaAuthorizer",
        identitySource: ["$request.header.Authorization"],
        resultsCacheTtl: cdk.Duration.seconds(0),
      }
    );

    // S3 Bucket
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
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SQS
    const catalogItemsQueue = new Queue(this, "ImportProductsQueue", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambdas
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

    const importFileParserFunction = new NodejsFunction(
      this,
      "ImportFileParserLambda",
      {
        ...sharedLambdaProps,
        entry: "lib/handlers/importFileParser.ts",
        functionName: "importFileParser",
        environment: {
          ...sharedLambdaProps.environment,
          PRODUCT_SQS_URL: catalogItemsQueue.queueUrl,
        },
      }
    );

    // Policies
    const sqsImportPolicy = new PolicyStatement({
      actions: ["sqs:SendMessage"],
      resources: [catalogItemsQueue.queueArn],
      effect: Effect.ALLOW,
    });

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

    importProductsFileFunction.addToRolePolicy(bucketUploadedPolicy);
    importFileParserFunction.addToRolePolicy(bucketParsedPolicy);
    importFileParserFunction.addToRolePolicy(sqsImportPolicy);
    importServiceBucket.grantReadWrite(importProductsFileFunction);
    importServiceBucket.grantReadWrite(importFileParserFunction);

    // Notifications
    importServiceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserFunction),
      {
        prefix: "uploaded/",
        suffix: "csv",
      }
    );

    // API Gateway
    const importsApiGateway = new apiGateway.HttpApi(
      this,
      "ImportsHttpApiGateway",
      {
        apiName: "ImportServiceHttpApi",
        corsPreflight: {
          allowHeaders: ["*"],
          allowOrigins: ["*"],
          allowMethods: [apiGateway.CorsHttpMethod.ANY],
          exposeHeaders: [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers",
          ],
        },
        createDefaultStage: false,
      }
    );

    importsApiGateway.addRoutes({
      path: "/import",
      methods: [apiGateway.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ImportServiceLambdaIntegration",
        importProductsFileFunction
      ),
      authorizer: tokenAuthorizer,
    });

    // Permission
    basicAuthorizerLambda.addPermission("ApiGatewayInvokePermissions", {
      action: "lambda:InvokeFunction",
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      // TODO any ideas how to get authorizer id? only from console... currently hard-coded
      sourceArn: `arn:aws:execute-api:${process.env.AWS_REGION}:637423488590:${importsApiGateway.apiId}/authorizers/6k0z7m`,
    });

    // Deploy stage
    const devStage = new apiGateway.HttpStage(
      this,
      "ImportsHttpApiGatewayDevStage",
      {
        httpApi: importsApiGateway,
        stageName: "dev",
        autoDeploy: true,
      }
    );

    new cdk.CfnOutput(this, "ApiUrl", {
      value: devStage.url ?? "",
    });

    new cdk.CfnOutput(this, "ImportProductsQueueUrl", {
      value: catalogItemsQueue.queueUrl,
      exportName: IMPORT_PRODUCTS_SQS_URL,
    });

    new cdk.CfnOutput(this, "ImportProductsQueueArn", {
      value: catalogItemsQueue.queueArn,
      exportName: IMPORT_PRODUCTS_SQS_ARN,
    });
  }
}
