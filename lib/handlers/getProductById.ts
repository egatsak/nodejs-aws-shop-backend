import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { products } from "../db/db";
import { buildResponse } from "../utils";
import { HttpError } from "../errorHandler";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const product = products.find(
      (prod) => prod.id === event.pathParameters?.productId
    );

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