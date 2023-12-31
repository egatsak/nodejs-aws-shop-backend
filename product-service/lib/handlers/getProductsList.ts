import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { buildResponse } from "../utils";
import { HttpError } from "../errorHandler";

const dynamoDb = new DynamoDBClient({
  region: "eu-north-1",
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Incoming: GET /products \n" + event.headers);

  try {
    const products = (
      await dynamoDb.send(new ScanCommand({ TableName: "Products" }))
    )?.Items?.map((it) => unmarshall(it));

    const stocks = (
      await dynamoDb.send(new ScanCommand({ TableName: "Stocks" }))
    )?.Items?.map((it) => unmarshall(it));

    if (!products) {
      throw new HttpError(404, "Products not found");
    }

    const result = products.map((product) => {
      const stock = stocks?.find((stock) => stock.product_id === product.id);
      return {
        ...product,
        count: stock?.count || 0,
      };
    });

    return buildResponse(200, result);
  } catch (error: unknown) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
