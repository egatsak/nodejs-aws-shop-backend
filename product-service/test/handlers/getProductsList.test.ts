import { APIGatewayProxyEvent } from "aws-lambda";
import { products } from "../../product-service/lib/db/db";
import { buildResponse } from "../../product-service/lib/utils";
import { HttpError } from "../../product-service/lib/errorHandler";
import { handler } from "../../product-service/lib/handlers/getProductsList";

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

describe("getProductsListLambda Handler Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should handle valid request and return products", async () => {
    await handler();
    expect(buildResponse).toHaveBeenCalledWith(200, products);
  });
});
