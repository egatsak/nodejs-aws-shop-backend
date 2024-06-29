import { Construct } from "constructs";
import {
  AttributeType,
  Billing,
  TableEncryptionV2,
  TableV2,
} from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../constants";

export interface ProductServiceDatabaseProps {
  lambdas: {
    getProductsList: NodejsFunction;
    getProductById: NodejsFunction;
    createProduct: NodejsFunction;
    catalogBatchProcess: NodejsFunction;
  };
}

export class ProductServiceDatabase extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ProductServiceDatabaseProps
  ) {
    super(scope, id);

    const {
      getProductsList,
      getProductById,
      createProduct,
      catalogBatchProcess,
    } = props.lambdas;

    const productsTable = new TableV2(this, "Products", {
      tableName: PRODUCTS_TABLE_NAME,
      encryption: TableEncryptionV2.dynamoOwnedKey(),
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "title", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billing: Billing.onDemand(),
    });
    productsTable.grantWriteData(createProduct);
    productsTable.grantWriteData(catalogBatchProcess);
    productsTable.grantReadData(getProductById);
    productsTable.grantReadData(getProductsList);

    const stocksTable = new TableV2(this, "Stocks", {
      tableName: STOCKS_TABLE_NAME,
      partitionKey: { name: "product_id", type: AttributeType.STRING },
      billing: Billing.onDemand(),
      encryption: TableEncryptionV2.dynamoOwnedKey(),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    stocksTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantReadData(getProductById);
    stocksTable.grantReadData(getProductsList);
  }
}
