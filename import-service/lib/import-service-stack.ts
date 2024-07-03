import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import * as s3 from "aws-cdk-lib/aws-s3";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import {
  BASIC_AUTHORIZER_LAMBDA_ARN,
  IMPORT_PRODUCTS_SQS_ARN,
  IMPORT_PRODUCTS_SQS_URL,
} from "../../constants";
import { TokenAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { HttpLambdaAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";

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

    const authRole = new Role(this, "BasicAuthorizerRole", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });

    /* authRole.addToPolicy(
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [basicAuthorizerLambda.functionArn],
      })
    ); */
    basicAuthorizerLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [basicAuthorizerLambda.functionArn],
      })
    );

    const tokenAuthorizer = new HttpLambdaAuthorizer(
      "BasicAuthorizer",
      basicAuthorizerLambda,
      {
        authorizerName: "MyLambdaAuthorizer",
        identitySource: ["$request.header.Authorization"],
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
        // role: authRole,
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
