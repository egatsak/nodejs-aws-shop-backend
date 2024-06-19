import { randomUUID } from "node:crypto";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dbDocumentClient } from "../db/client";
import { buildResponse } from "../utils";
import { HttpError } from "../errorHandler";
import { ProductDto, productDtoSchema } from "../dtos";
import type { PopulatedProduct } from "../types";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../constants";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Incoming: POST /products \n" + event.body);

  try {
    const productDto = JSON.parse(event.body ?? "") as ProductDto;

    await productDtoSchema.validateAsync(productDto);

    const { count, ...product } = productDto;
    const productId = randomUUID();

    const productToDb = { ...product, id: productId };

    const stockToDb = {
      product_id: productId,
      count: count,
      id: randomUUID(),
    };

    await dbDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: PRODUCTS_TABLE_NAME,
              Item: productToDb,
            },
          },
          {
            Put: {
              TableName: STOCKS_TABLE_NAME,
              Item: stockToDb,
            },
          },
        ],
      })
    );

    const createdProduct = {
      ...productDto,
      id: productId,
    } satisfies PopulatedProduct;

    return buildResponse(201, createdProduct);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
