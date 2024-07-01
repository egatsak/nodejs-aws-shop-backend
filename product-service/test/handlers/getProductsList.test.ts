import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dbDocumentClient } from "../../lib/db/client";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../../lib/constants";
import { handler } from "../../lib/handlers/getProductsList";
import { buildResponse } from "../../lib/utils";
import type { Product, Stock } from "../../lib/types";

const ddbMock = mockClient(dbDocumentClient);
jest.mock("../../lib/utils");

describe("GET /products", () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  test("should return all products with their stock counts", async () => {
    const products: Product[] = [
      { id: "1", title: "Product 1", description: "Description 1", price: 100 },
      { id: "2", title: "Product 2", description: "Description 2", price: 200 },
    ];
    const stocks: Stock[] = [
      { product_id: "1", count: 10 },
      { product_id: "2", count: 5 },
    ];

    ddbMock
      .on(ScanCommand, { TableName: PRODUCTS_TABLE_NAME })
      .resolves({ Items: products });
    ddbMock
      .on(ScanCommand, { TableName: STOCKS_TABLE_NAME })
      .resolves({ Items: stocks });

    const event = {} as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result).toEqual(
      buildResponse(200, [
        { ...products[0], count: 10 },
        { ...products[1], count: 5 },
      ])
    );
  });

  test("should return products with count 0 if stock is not found", async () => {
    const products: Product[] = [
      { id: "1", title: "Product 1", description: "Description 1", price: 100 },
    ];
    const stocks: Stock[] = [];

    ddbMock
      .on(ScanCommand, { TableName: PRODUCTS_TABLE_NAME })
      .resolves({ Items: products });
    ddbMock
      .on(ScanCommand, { TableName: STOCKS_TABLE_NAME })
      .resolves({ Items: stocks });

    const event = {} as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result).toEqual(buildResponse(200, [{ ...products[0], count: 0 }]));
  });

  test("should handle errors gracefully", async () => {
    ddbMock.on(ScanCommand).rejects(new Error("DynamoDB error"));

    const event = {} as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result).toEqual(buildResponse(500, { message: "Smth went wrong" }));
  });
});
