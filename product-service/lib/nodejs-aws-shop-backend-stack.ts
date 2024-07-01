import { CfnOutput, Fn, Stack, StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ProductServiceDatabase } from "./db/db";
import { IMPORT_PRODUCTS_SQS_ARN } from "../../constants";
import { Queue } from "aws-cdk-lib/aws-sqs";
import {
  Subscription,
  SubscriptionFilter,
  SubscriptionProtocol,
  Topic,
} from "aws-cdk-lib/aws-sns";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { IMPORT_PRODUCTS_SQS_BATCH_SIZE } from "./constants";

const sharedLambdaProps: NodejsFunctionProps = {
  runtime: lambda.Runtime.NODEJS_20_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  },
};

export class NodejsAwsShopBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // SQS & SNS
    const productsSqsArn = Fn.importValue(IMPORT_PRODUCTS_SQS_ARN);

    const catalogItemsQueueImported = Queue.fromQueueArn(
      this,
      "ImportedImportProductsQueue",
      productsSqsArn
    );

    const createProductTopic = new Topic(this, "CreateProductTopic", {
      topicName: "CreateProductTopic",
    });

    // Lambdas
    const getProductsList = new NodejsFunction(this, "GetProductsListLambda", {
      ...sharedLambdaProps,
      functionName: "getProductsList",
      entry: "lib/handlers/getProductsList.ts",
    });

    const getProductById = new NodejsFunction(this, "GetProductByIdLambda", {
      ...sharedLambdaProps,
      functionName: "getProductById",
      entry: "lib/handlers/getProductById.ts",
    });

    const createProduct = new NodejsFunction(this, "CreateProductLambda", {
      ...sharedLambdaProps,
      functionName: "createProduct",
      entry: "lib/handlers/createProduct.ts",
    });

    const catalogBatchProcess = new NodejsFunction(
      this,
      "CatalogBatchProcessLambda",
      {
        ...sharedLambdaProps,
        functionName: "catalogBatchProcess",
        entry: "lib/handlers/catalogBatchProcess.ts",
        environment: {
          SNS_TOPIC_ARN: createProductTopic.topicArn,
        },
      }
    );

    // DynamoDB
    new ProductServiceDatabase(this, "ProductServiceDatabase", {
      lambdas: {
        createProduct,
        getProductById,
        getProductsList,
        catalogBatchProcess,
      },
    });

    // Subscriptions

    catalogBatchProcess.addEventSource(
      new SqsEventSource(catalogItemsQueueImported, {
        batchSize: IMPORT_PRODUCTS_SQS_BATCH_SIZE,
      })
    );

    const createProductTopicSubscription = new Subscription(
      this,
      "CreateProductTopicSubscription",
      {
        endpoint: process.env.SNS_SUBSCRIBE_EMAIL ?? "",
        protocol: SubscriptionProtocol.EMAIL,
        topic: createProductTopic,
      }
    );

    const createExpensiveProductTopicSubscription = new Subscription(
      this,
      "CreateExpensiveProductTopicSubscription",
      {
        endpoint: process.env.SNS_SUBSCRIBE_EXPENSIVE_EMAIL ?? "",
        protocol: SubscriptionProtocol.EMAIL,
        topic: createProductTopic,
        filterPolicy: {
          expensive: SubscriptionFilter.numericFilter({ greaterThan: 0 }),
        },
      }
    );

    // ApiGateway
    const api = new apiGateway.HttpApi(this, "ProductApi", {
      apiName: "ProductServiceHttpApi",
      corsPreflight: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
      },
      createDefaultStage: false,
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration(
        "GetProductsListIntegration",
        getProductsList
      ),
      path: "/products",
      methods: [apiGateway.HttpMethod.GET],
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration(
        "GetProductByIdIntegration",
        getProductById
      ),
      path: "/products/{productId}",
      methods: [apiGateway.HttpMethod.GET],
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration(
        "CreateProductIntegration",
        createProduct
      ),
      path: "/products",
      methods: [apiGateway.HttpMethod.POST],
    });

    // Policies
    catalogBatchProcess.addToRolePolicy(
      new PolicyStatement({
        actions: ["sns:Publish"],
        resources: [createProductTopic.topicArn],
        effect: Effect.ALLOW,
      })
    );

    // Deploy stage
    const devStage = new apiGateway.HttpStage(
      this,
      "ProductHttpApiGatewayDevStage",
      {
        httpApi: api,
        stageName: "dev",
        autoDeploy: true,
      }
    );

    new CfnOutput(this, "ApiUrl", {
      value: devStage.url ?? "",
    });
  }
}
