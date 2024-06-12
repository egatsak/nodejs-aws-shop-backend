import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { products } from "../db/db";
import { buildResponse } from "../utils";
import { HttpError } from "../errorHandler";

export const handler = async (
  event?: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    return buildResponse(200, products);
  } catch (error: unknown) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
