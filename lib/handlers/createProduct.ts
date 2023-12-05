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
  console.log("Incoming: POST /products \n" + event);

  try {
    const productDto = JSON.parse(event.body ?? "") as ProductDto;

    const validationResult = productDtoSchema.validate(productDto);

    if (validationResult.error) {
      throw validationResult.error;
    }

    const { count, ...product } = productDto;
    const productId = randomUUID();

    await dynamoDb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: "Products",
              Item: { product, id: productId },
            },
          },
          {
            Put: {
              TableName: "Stocks",
              Item: {
                product_id: productId,
                count: count,
              },
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
  } catch (error: unknown) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
