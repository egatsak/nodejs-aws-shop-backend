import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { handler } from "../lib/handlers/importProductsFile";
import { buildResponse } from "../lib/utils";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

describe("ImportProductsFile", () => {
  it("should generate signed url", async () => {
    const mockUploadUrl = "https://mocked-s3-url.com/my123.csv";
    (getSignedUrl as jest.Mock).mockResolvedValue(mockUploadUrl);

    const response = await handler({
      queryStringParameters: { name: "my123.csv" },
    } as any);

    expect(response).toEqual(buildResponse(200, { uploadUrl: mockUploadUrl }));
  });

  it("should return BadRequest error on incorrect file", async () => {
    const response = await handler({
      queryStringParameters: { name: "my123.baz" },
    } as any);

    expect(response).toEqual(
      buildResponse(400, { message: `Please upload valid CSV file.` })
    );
  });

  it("should return Internal Server Error on request presigner error", async () => {
    (getSignedUrl as jest.Mock).mockImplementationOnce(() => {
      throw new Error("GetSignedUrlError");
    });

    const response = await handler({
      queryStringParameters: { name: "my123.csv" },
    } as any);

    expect(response).toEqual(
      buildResponse(500, { message: `GetSignedUrlError` })
    );
  });
});
