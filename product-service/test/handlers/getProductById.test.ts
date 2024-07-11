import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../../lib/constants";
import { buildResponse } from "../../lib/utils";
import { handler } from "../../lib/handlers/getProductById";

const ddbMock = mockClient(DynamoDBDocumentClient);

jest.mock("../../lib/utils", () => ({
  buildResponse: jest.fn(),
}));

describe("Get Product by ID", () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  test("should return product with stock count", async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        productId: "123",
      },
    };

    ddbMock
      .on(QueryCommand, {
        TableName: PRODUCTS_TABLE_NAME,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
          ":id": "123",
        },
      })
      .resolves({
        Items: [
          {
            id: "123",
            title: "Product 123",
            description: "Description 123",
            price: 123,
          },
        ],
      });

    ddbMock
      .on(QueryCommand, {
        TableName: STOCKS_TABLE_NAME,
        KeyConditionExpression: "product_id = :product_id",
        ExpressionAttributeValues: {
          ":product_id": "123",
        },
      })
      .resolves({
        Items: [
          {
            product_id: "123",
            count: 10,
          },
        ],
      });

    (buildResponse as jest.Mock).mockImplementation((statusCode, body) => ({
      statusCode,
      body: JSON.stringify(body),
    }));

    const result: APIGatewayProxyResult = await handler(
      event as APIGatewayProxyEvent
    );

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      id: "123",
      title: "Product 123",
      description: "Description 123",
      price: 123,
      count: 10,
    });
  });

  test("should return 404 if product is not found", async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        productId: "123",
      },
    };

    ddbMock
      .on(QueryCommand, {
        TableName: PRODUCTS_TABLE_NAME,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
          ":id": "123",
        },
      })
      .resolves({
        Items: [],
      });

    const result: APIGatewayProxyResult = await handler(
      event as APIGatewayProxyEvent
    );

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      message: "Product not found",
    });
  });

  test("should return 500 if there is an internal error", async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        productId: "123",
      },
    };

    ddbMock.on(QueryCommand).rejects(new Error("Internal server error"));

    const result: APIGatewayProxyResult = await handler(
      event as APIGatewayProxyEvent
    );

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      message: "Internal server error",
    });
  });
});
