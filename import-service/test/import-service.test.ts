import { handler } from "../lib/handlers/importProductsFile";
import { buildResponse } from "../lib/utils";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner", () => {
  return {
    getSignedUrl: () => {
      return "my-signed.xlsx";
    },
  };
});

describe("ImportProductsFile", () => {
  it("should generate signed url", async () => {
    const response = await handler({
      queryStringParameters: { name: "my.xlsx" },
    } as any);
    expect(response).toEqual(buildResponse(200, "my-signed.xlsx"));
  });
});
