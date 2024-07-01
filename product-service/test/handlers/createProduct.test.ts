import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dbDocumentClient } from "../../lib/db/client";
import { buildResponse } from "../../lib/utils";
import { handler } from "../../lib/handlers/createProduct";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../../lib/constants";
import type { ProductDto } from "../../lib/dtos";

const ddbMock = mockClient(dbDocumentClient);
jest.mock("../../lib/utils");
jest.mock("node:crypto", () => ({
  randomUUID: jest.fn(() => "test-uuid"),
}));

describe("POST /products", () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  test("should create a product and stock successfully", async () => {
    const productDto: ProductDto = {
      title: "Product 1",
      description: "Description 1",
      price: 100,
      count: 10,
    };

    ddbMock.on(TransactWriteCommand).resolves({});

    const event = {
      body: JSON.stringify(productDto),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result).toEqual(
      buildResponse(201, { ...productDto, id: "test-uuid" })
    );

    expect(ddbMock).toHaveReceivedCommandWith(TransactWriteCommand, {
      TransactItems: [
        {
          Put: {
            TableName: PRODUCTS_TABLE_NAME,
            Item: {
              title: "Product 1",
              description: "Description 1",
              price: 100,
              id: "test-uuid",
            },
          },
        },
        {
          Put: {
            TableName: STOCKS_TABLE_NAME,
            Item: {
              product_id: "test-uuid",
              count: 10,
              id: "test-uuid",
            },
          },
        },
      ],
    });
  });

  test("should return 400 for invalid product data", async () => {
    const invalidProductDto = {
      title: "Product 1",
      description: "Description 1",
      price: "invalid-price",
      count: 10,
    };

    const event = {
      body: JSON.stringify(invalidProductDto),
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result).toEqual(
      buildResponse(400, {
        message: expect.any(String),
      })
    );
  });

  test("should return 500 for internal server error", async () => {
    const productDto: ProductDto = {
      title: "Product 1",
      description: "Description 1",
      price: 100,
      count: 10,
    };

    ddbMock.on(TransactWriteCommand).rejects(new Error("DynamoDB error"));

    const event = {
      body: JSON.stringify(productDto),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result).toEqual(buildResponse(500, { message: "Smth went wrong" }));
  });
});
