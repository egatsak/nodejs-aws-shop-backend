import { APIGatewayEvent } from "aws-lambda";
import { s3Client } from "../client";
import { buildResponse } from "../utils";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = async function (event: APIGatewayEvent) {
  console.log("importProductsFile: ", event);

  try {
    if (!event.queryStringParameters) {
      return buildResponse(400, { message: "Please provide queryString" });
    }
    const { name } = event.queryStringParameters;

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
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
