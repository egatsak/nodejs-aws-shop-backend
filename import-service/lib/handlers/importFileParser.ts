import { Readable } from "node:stream";
import { S3Event } from "aws-lambda";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { CastingContext, parse } from "csv-parse";
import { buildResponse } from "../utils";

export const handler = async (event: S3Event) => {
  console.log("importFileParser: ", event.Records);

  try {
    const s3File = event.Records[0].s3;

    const s3Client = new S3Client({
      region: process.env.AWS_REGION ?? "us_east_1",
    });

    const getObjectCommandOutput = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3File.bucket.name,
        Key: s3File.object.key,
      })
    );

    (getObjectCommandOutput.Body as Readable)
      .pipe(
        parse({
          columns: true,
          cast: (value: string, context: CastingContext) => {
            if (context.header) return value;
            switch (context.column) {
              case "price":
                return Number.parseFloat(value);
              case "count":
                return Number.parseInt(value);
            }
            return value;
          },
        })
      )
      .on("data", (data: unknown) => {
        console.log(data, typeof data, Array.isArray(data));
      })
      .on("error", (error: Error) => {
        console.error("Error parsing CSV:", error);
      })
      .on("finish", async () => {
        console.log(s3File.object);

        await s3Client.send(
          new CopyObjectCommand({
            CopySource: `${s3File.bucket.name}/${s3File.object.key}`,
            Bucket: s3File.bucket.name,
            Key: `parsed/${s3File.object.key.split("/").slice(-1)}`,
          })
        );

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3File.bucket.name,
            Key: s3File.object.key,
          })
        );

        console.log(`1111111111111111111111111111111 we're here`);

        return buildResponse(200, {
          message: `File ${s3File.object.key} successfully parsed`,
        });
      });

    return buildResponse(500, {
      message: `Unknown error`,
    });
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    console.log(`222222222222222222222222222222222222 we're in the error`);

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
