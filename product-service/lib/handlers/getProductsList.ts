import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dbDocumentClient } from "../db/client";
import { buildResponse } from "../utils";
import { HttpError } from "../errorHandler";
import { productsTableName, stocksTableName } from "../constants";
import type { MyScanCommandOutput } from "../db/types";
import type { Product, Stock } from "../types";

// TODO add env vars for table names, etc

export const handler = async (
  event?: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { Items: productItems } = (await dbDocumentClient.send(
      new ScanCommand({
        TableName: productsTableName,
      })
    )) as MyScanCommandOutput<Product[]>;

    const { Items: stockItems } = (await dbDocumentClient.send(
      new ScanCommand({
        TableName: stocksTableName,
      })
    )) as MyScanCommandOutput<Stock[]>;

    const availableProducts = productItems ?? [];
    const availableStocks = stockItems ?? [];

    // DynamoDB doesn't support joins

    const resultProducts = availableProducts.map((product) => {
      const stock = availableStocks.find(
        (stock) => stock.product_id === product.id
      );
      return {
        ...product,
        stock: stock?.count ?? 0,
      };
    });

    return buildResponse(200, resultProducts);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
