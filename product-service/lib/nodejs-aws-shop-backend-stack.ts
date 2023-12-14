import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

const sharedLambdaProps: NodejsFunctionProps = {
  runtime: lambda.Runtime.NODEJS_20_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION ?? "eu-north-1",
  },
};

export class NodejsAwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductList = new NodejsFunction(this, "GetProductsListLambda", {
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

    const productsTable = TableV2.fromTableName(
      this,
      "ProductsTable",
      "Products"
    );
    const stocksTable = TableV2.fromTableName(this, "StocksTable", "Stocks");

    productsTable.grantReadData(getProductList);
    stocksTable.grantReadData(getProductList);

    productsTable.grantReadData(getProductById);
    stocksTable.grantReadData(getProductById);

    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);

    const api = new apiGateway.HttpApi(this, "ProductApi", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
      },
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration(
        "GetProductsListIntegration",
        getProductList
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

    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      displayName: "Create Product Topic",
    });

    createProductTopic.addSubscription(
      new EmailSubscription("egatsak@yandex.ru", {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThan: 1000,
          }),
        },
      })
    );

    createProductTopic.addSubscription(
      new EmailSubscription("greenglaz@gmail.com")
    );

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "CatalogItemsQueue",
    });

    const catalogBatchProcessFunction = new NodejsFunction(
      this,
      "CatalogBatchProcessFunction",
      {
        ...sharedLambdaProps,
        environment: {
          PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION ?? "eu-north-1",
          CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
        },
        entry: "lib/handlers/catalogBatchProcess.ts",
        handler: "catalogBatchProcess",
      }
    );

    createProductTopic.grantPublish(catalogBatchProcessFunction);
    catalogBatchProcessFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, { batchSize: 5 })
    );
  }
}
