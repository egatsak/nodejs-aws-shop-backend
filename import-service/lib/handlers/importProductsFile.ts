import { APIGatewayEvent } from "aws-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { buildResponse } from "../utils";
import { HttpError } from "./errorHandler";

const s3 = new S3Client({ region: "eu-north-1" });
const bucketName = "upload-aws-course-egatsak";

export const handler = async function (event: APIGatewayEvent) {
  try {
    if (!event.queryStringParameters) {
      throw new HttpError(400, "Please provide queryString");
    }
    const { name } = event.queryStringParameters;

    if (!name?.endsWith(".csv")) {
      throw new HttpError(400, "Incorrect file type");
    }

    const presignedPost = await createPresignedPost(s3, {
      Bucket: bucketName,
      Key: `uploaded/${name}`,
      Fields: {
        "Content-Type": "text/csv",
      },
      Expires: 12000,
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
