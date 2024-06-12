import { APIGatewayProxyEvent } from "aws-lambda";
import { products } from "../../lib/db/db";
import { buildResponse } from "../../lib/utils";
import { HttpError } from "../../lib/errorHandler";
import { handler } from "../../lib/handlers/getProductById";

// Mocking the necessary modules
jest.mock("../../lib/db/db", () => ({
  products: [
    {
      id: "855e9a53-dd3c-46b8-8cb1-329f133146f6",
      description: "Short Product Description1",
      price: 24,
      title: "ProductOne",
    },
    {
      id: "d5c67566-72ff-4f1e-b4f0-ecc9b84b2b40",
      description: "Short Product Description7",
      price: 15,
      title: "ProductTitle",
    },
    {
      id: "a5116cf4-9915-4a91-8424-14dc3d5e6cb2",
      description: "Short Product Description2",
      price: 23,
      title: "Product",
    },
  ],
}));

jest.mock("../../lib/utils.ts", () => ({
  buildResponse: jest.fn(),
}));

describe("getProductById Lambda Handler Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const testEvent: APIGatewayProxyEvent = {
    pathParameters: {
      productId: "855e9a53-dd3c-46b8-8cb1-329f133146f6",
    },
    body: "",
    headers: {},
    multiValueHeaders: {},
    httpMethod: "GET",
    isBase64Encoded: false,
    path: "",
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    stageVariables: {},
    requestContext: {} as any,
    resource: "",
  };

  it("should handle valid product request", async () => {
    await handler(testEvent);

    expect(buildResponse).toHaveBeenCalledWith(200, products[0]);
  });

  it("should handle product not found error", async () => {
    const event: APIGatewayProxyEvent = {
      ...testEvent,
      pathParameters: {
        productId: "NONEXISTENT-ID",
      },
    };

    await handler(event);

    expect(buildResponse).toHaveBeenCalledWith(404, {
      message: "Product not found",
    });
  });

  it("should handle generic error", async () => {
    const event: APIGatewayProxyEvent = {
      ...testEvent,
      pathParameters: {
        productId: "any-ID",
      },
    };

    const genericError = new Error("Something went wrong");
    jest.spyOn(products, "find").mockImplementation(() => {
      throw genericError;
    });

    await handler(event);

    expect(buildResponse).toHaveBeenCalledWith(500, {
      message: "Something went wrong",
    });
  });

  it("should handle HttpError", async () => {
    const event: APIGatewayProxyEvent = {
      ...testEvent,
      pathParameters: {
        productId: "any-ID",
      },
    };

    const httpError = new HttpError(403, "Forbidden");
    jest.spyOn(products, "find").mockImplementation(() => {
      throw httpError;
    });

    await handler(event);

    expect(buildResponse).toHaveBeenCalledWith(403, {
      message: "Forbidden",
    });
  });
});
