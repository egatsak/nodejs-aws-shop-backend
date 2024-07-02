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

    const parser = (getObjectCommandOutput.Body as Readable).pipe(
      parse({
        columns: true,
        cast: (value: string, ctx: CastingContext) => {
          if (ctx.header) return value;

          switch (ctx.column) {
            case "price":
              return Number.parseFloat(value);
            case "count":
              return Number.parseInt(value);
            default:
              return value;
          }
        },
      })
    );

    for await (const row of parser) {
      console.log(row);
    }

    const copyResult = await s3Client.send(
      new CopyObjectCommand({
        CopySource: `${s3File.bucket.name}/${s3File.object.key}`,
        Bucket: s3File.bucket.name,
        Key: `parsed/${s3File.object.key.split("/").slice(-1)}`,
      })
    );

    if (copyResult.$metadata.httpStatusCode !== 200) {
      throw new Error("Error while copying object!");
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: s3File.bucket.name,
        Key: s3File.object.key,
      })
    );

    return buildResponse(201, {
      message: `File successfully parsed`,
    });
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong",
    });
  }
};
