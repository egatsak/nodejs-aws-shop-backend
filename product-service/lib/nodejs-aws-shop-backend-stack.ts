import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
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
  }
}
