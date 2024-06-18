import { Construct } from "constructs";
import {
  AttributeType,
  Billing,
  TableEncryptionV2,
  TableV2,
} from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";
import { productsTableName, stocksTableName } from "../constants";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export interface ProductServiceDatabaseProps {
  lambdas: {
    getProductsList: NodejsFunction;
    getProductById: NodejsFunction;
    createProduct: NodejsFunction;
  };
}

export class ProductServiceDatabase extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ProductServiceDatabaseProps
  ) {
    super(scope, id);

    const { getProductsList, getProductById, createProduct } = props.lambdas;

    const productsTable = new TableV2(this, "Products", {
      tableName: productsTableName,
      encryption: TableEncryptionV2.dynamoOwnedKey(),
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "title", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billing: Billing.onDemand(),
    });
    productsTable.grantWriteData(createProduct);
    productsTable.grantReadData(getProductById);
    productsTable.grantReadData(getProductsList);

    const stocksTable = new TableV2(this, "Stocks", {
      tableName: stocksTableName,
      partitionKey: { name: "product_id", type: AttributeType.STRING },
      billing: Billing.onDemand(),
      encryption: TableEncryptionV2.dynamoOwnedKey(),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    stocksTable.grantWriteData(createProduct);
    stocksTable.grantReadData(getProductById);
    stocksTable.grantReadData(getProductsList);
  }
}
