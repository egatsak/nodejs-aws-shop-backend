import { randomUUID } from "node:crypto";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ProductDto, ProductForFrontend, productDtoSchema } from "../dto";
import { HttpError } from "../errorHandler";
import { buildResponse } from "../utils";

const dynamoDb = new DynamoDBClient({
  region: "eu-north-1",
});

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

    await dynamoDb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: "Products",
              Item: productToDb,
            },
          },
          {
            Put: {
              TableName: "Stocks",
              Item: stockToDb,
            },
          },
        ],
      })
    );

    const createdProduct = {
      ...productDto,
      id: productId,
    } as ProductForFrontend;

    return buildResponse(201, createdProduct);
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
