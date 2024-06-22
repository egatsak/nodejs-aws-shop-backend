import { APIGatewayEvent } from "aws-lambda";
import { buildResponse } from "../utils";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HttpError } from "../errorHandler";

export const handler = async function (event: APIGatewayEvent) {
  console.log("importProductsFile: ", {
    body: event.body,
    headers: event.headers,
    httpMethod: event.httpMethod,
    pathParameters: event.pathParameters,
    path: event.path,
  });

  try {
    if (!event.queryStringParameters) {
      throw new HttpError(400, "Please provide queryString.");
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
    });

    const { name } = event.queryStringParameters;

    if (!name?.endsWith(".csv")) {
      throw new HttpError(400, "Please upload valid CSV file.");
    }

    const putObjCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME ?? "egatsak-import-service-bucket",
      Key: `uploaded/${name}`,
    });

    const signedUrl = await getSignedUrl(s3Client, putObjCommand, {
      expiresIn: 120,
    });

    return buildResponse(200, {
      uploadUrl: signedUrl,
    });
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
