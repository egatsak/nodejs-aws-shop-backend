import { Readable } from "node:stream";
import { S3Event } from "aws-lambda";
import { buildResponse } from "../utils";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { parse } from "csv-parse";

export const handler = async (event: S3Event) => {
  console.log("importFileParser: ", event.Records);

  try {
    const s3Client = new S3Client();

    const s3File = event.Records[0].s3;
    const getObjectCommandOutput = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3File.bucket.name,
        Key: s3File.object.key,
      })
    );

    await (getObjectCommandOutput.Body as Readable)
      .pipe(parse())
      .on("data", (row: string) => {
        console.log(row);
      })
      .on("error", (error: Error) => {
        console.error("Error parsing CSV:", error);
      });

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

    return buildResponse(200, {});
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;

    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
