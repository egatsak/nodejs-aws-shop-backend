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
import {
  IMPORT_PRODUCTS_SQS_ARN,
  IMPORT_PRODUCTS_SQS_URL,
} from "../../constants";
import { Queue } from "aws-cdk-lib/aws-sqs";
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

    const productsSqsUrl = Fn.importValue(IMPORT_PRODUCTS_SQS_URL);
    const productsSqsArn = Fn.importValue(IMPORT_PRODUCTS_SQS_ARN);

    const catalogItemsQueueImported = Queue.fromQueueArn(
      this,
      "ImportedImportProductsQueue",
      productsSqsArn
    );

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
          ...sharedLambdaProps.environment,
          PRODUCT_SQS_URL: catalogItemsQueueImported.queueUrl,
        },
      }
    );

    catalogBatchProcess.addEventSource(
      new SqsEventSource(catalogItemsQueueImported, {
        batchSize: IMPORT_PRODUCTS_SQS_BATCH_SIZE,
      })
    );

    const api = new apiGateway.HttpApi(this, "ProductApi", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
      },
    });

    new ProductServiceDatabase(this, "ProductServiceDatabase", {
      lambdas: {
        createProduct,
        getProductById,
        getProductsList,
      },
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

    new CfnOutput(this, "ApiUrl", {
      value: api.url ?? "",
    });
  }
}
