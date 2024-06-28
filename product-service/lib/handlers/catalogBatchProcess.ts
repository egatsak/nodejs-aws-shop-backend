import { SQSEvent } from "aws-lambda";
import { ProductDto, productDtoSchema } from "../dtos";
import { dbDocumentClient } from "../db/client";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../constants";
import { randomUUID } from "crypto";
import {
  TransactWriteCommand,
  TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";

export const handler = async (event: SQSEvent) => {
  console.log(`Products: ${event.Records}`);

  try {
    // parse products from SQS
    const products: ProductDto[] = [];
    event.Records.forEach(async (record) => {
      const product = JSON.parse(record.body);
      try {
        const validatedProduct = await productDtoSchema.validateAsync(product);

        products.push(validatedProduct);
      } catch (e) {
        console.log(`Product parse error: ${record}. Error: ${e}`);
      }
    });

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
              },
            },
          },
          {
            Put: {
              TableName: STOCKS_TABLE_NAME,
              Item: {
                product_id: productId,
                count,
              },
            },
          },
        ];
      });

    await dbDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: createProductsTransactionPayload,
      })
    );
  } catch (e) {
    console.log(`catalogBatchProcess failed`);
  }
};
