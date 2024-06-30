import { randomUUID } from "crypto";
import {
  TransactWriteCommand,
  TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { SQSEvent } from "aws-lambda";
import { dbDocumentClient } from "../db/client";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../constants";
import type { ProductDto } from "../dtos";
import type { Product, Stock } from "../types";

export const handler = async (event: SQSEvent) => {
  console.log(`Products: ${event.Records}`);

  const products: ProductDto[] = [];

  try {
    // parse products from SQS

    event.Records.forEach((record) => {
      const product = JSON.parse(record.body);
      products.push(product);
    });

    if (!products.length) {
      return;
    }

    const createProductsTransactionPayload: TransactWriteCommandInput["TransactItems"] =
      products.map((prod) => {
        const { count, ...product } = prod;

        const productId = randomUUID();

        return [
          {
            Put: {
              TableName: PRODUCTS_TABLE_NAME,
              Item: {
                ...product,
                id: productId,
              } satisfies Product,
            },
          },
          {
            Put: {
              TableName: STOCKS_TABLE_NAME,
              Item: {
                product_id: productId,
                count,
              } satisfies Stock,
            },
          },
        ];
      });

    await dbDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: createProductsTransactionPayload.flat(),
      })
    );
  } catch (e) {
    console.log(`catalogBatchProcess failed`);
    console.log(e);
  }
};
