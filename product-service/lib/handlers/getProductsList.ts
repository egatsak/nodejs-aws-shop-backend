import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dbDocumentClient } from "../db/client";
import { buildResponse } from "../utils";
import { HttpError } from "../errorHandler";
import type { MyScanCommandOutput } from "../db/types";
import type { PopulatedProduct, Product, Stock } from "../types";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../constants";

export const handler = async (
  event?: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Incoming: GET /products\n" + event);

  try {
    const [{ Items: productItems }, { Items: stockItems }] = await Promise.all([
      (await dbDocumentClient.send(
        new ScanCommand({
          TableName: PRODUCTS_TABLE_NAME,
        })
      )) as MyScanCommandOutput<Product[]>,

      (await dbDocumentClient.send(
        new ScanCommand({
          TableName: STOCKS_TABLE_NAME,
        })
      )) as MyScanCommandOutput<Stock[]>,
    ]);

    const availableProducts = productItems ?? [];
    const availableStocks = stockItems ?? [];

    // DynamoDB doesn't support joins

    const resultProducts = availableProducts.map((product) => {
      const stock = availableStocks.find(
        (stock) => stock.product_id === product.id
      );
      return {
        ...product,
        count: stock?.count ?? 0,
      } satisfies PopulatedProduct;
    });

    return buildResponse(200, resultProducts);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
