import { APIGatewayEvent } from "aws-lambda";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { s3Client } from "../client";
import { buildResponse } from "../utils";

export const handler = async function (event: APIGatewayEvent) {
  console.log("importProductsFile: ", event);

  try {
    if (!event.queryStringParameters) {
      return buildResponse(400, { message: "Please provide queryString" });
    }
    const { name } = event.queryStringParameters;

    const presignedPost = await createPresignedPost(s3Client, {
      Bucket: process.env.BUCKET_NAME ?? "egatsak-import-service-bucket",
      Key: `uploaded/${name}`,
      Fields: {
        "Content-Type": "text/csv",
      },
      Expires: 2400,
    });

    return buildResponse(200, {
      uploadUrl: presignedPost.url,
      fields: presignedPost.fields,
    });
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
