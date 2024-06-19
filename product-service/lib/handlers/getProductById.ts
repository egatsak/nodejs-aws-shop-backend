import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dbDocumentClient } from "../db/client";
import { HttpError } from "../errorHandler";
import { buildResponse } from "../utils";
import type { MyQueryCommandOutput } from "../db/types";
import type { PopulatedProduct, Product, Stock } from "../types";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../constants";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { Items: products } = (await dbDocumentClient.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE_NAME,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
          ":id": event.pathParameters?.productId,
        },
      })
    )) as MyQueryCommandOutput<Product[]>;

    if (!products?.length) {
      throw new HttpError(404, "Product not found");
    }

    const product = products[0];

    const { Items: stocks } = (await dbDocumentClient.send(
      new QueryCommand({
        TableName: STOCKS_TABLE_NAME,
        KeyConditionExpression: "product_id = :product_id",
        ExpressionAttributeValues: {
          ":product_id": event.pathParameters?.productId,
        },
      })
    )) as MyQueryCommandOutput<Stock[]>;

    const stock = stocks?.find(
      (stock) => stock.product_id === event.pathParameters?.productId
    );

    // DynamoDB doesn't support joins

    const availableProduct = {
      ...product,
      count: stock?.count || 0,
    } satisfies PopulatedProduct;

    return buildResponse(200, availableProduct);
  } catch (error: unknown) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
