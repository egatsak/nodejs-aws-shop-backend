import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { products } from "../db/db";
import { buildResponse } from "../utils";
import { HttpError } from "../errorHandler";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoDb = new DynamoDBClient({
  region: process.env.PRODUCT_AWS_REGION || "eu-west-1",
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      throw new HttpError(
        400,
        "Please provide a valid ProductId as a path parameter"
      );
    }

    const cmd = new QueryCommand({
      TableName: "Products",
      KeyConditionExpression: `id = :id`,
      ExpressionAttributeValues: { ":id": { S: productId } },
    });

    const result = await dynamoDb.send(cmd);
    const product = result.Items?.[0] ? unmarshall(result.Items[0]) : null;

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    return buildResponse(200, product);
  } catch (error: unknown) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
