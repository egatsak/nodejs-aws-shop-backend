import {Readable} from "node:stream";
import {S3Event} from "aws-lambda";
import {CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {SQSClient, SendMessageBatchCommand} from "@aws-sdk/client-sqs";
import {CastingContext, parse} from "csv-parse";
import {buildResponse, createBatches} from "../utils";
import {ProductDto, productDtoSchema} from "../dtos";
import {SQS_MAX_BATCH_SIZE} from "../../../constants";
import {randomUUID} from "node:crypto";

export const handler = async (event: S3Event) => {
  console.log("importFileParser: ", event.Records);

  try {
    const s3File = event.Records[0].s3;
    const s3Client = new S3Client({
      region: process.env.AWS_REGION ?? "us_east_1"
    });

    const sqsClient = new SQSClient();

    const getObjectCommandOutput = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3File.bucket.name,
        Key: s3File.object.key
      })
    );

    const parsedProducts: ProductDto[] = [];

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
        }
      })
    );

    for await (const row of parser) {
      try {
        const validated = await productDtoSchema.validateAsync(row);
        parsedProducts.push(validated);
      } catch (error: unknown) {
        console.log(`Error parsing csv row: ${row} \n ${error}`);
      }
    }

    const batchSize = Number.isInteger(Number(process.env.SQS_BATCH_SIZE))
      ? Number(process.env.SQS_BATCH_SIZE)
      : SQS_MAX_BATCH_SIZE;

    const batches = createBatches(parsedProducts, batchSize);

    const sqsBatchPromises = batches.map(batch => {
      const sqsBatch = sqsClient.send(
        new SendMessageBatchCommand({
          QueueUrl: process.env.PRODUCT_SQS_URL ?? "",
          Entries: batch.map((product, index) => {
            return {
              Id: `${randomUUID()}_${index}`,
              MessageBody: JSON.stringify(product)
            };
          })
        })
      );
      return sqsBatch;
    });

    const settledResults = await Promise.allSettled(sqsBatchPromises);

    settledResults.forEach((result, ind) => {
      if (result.status === "fulfilled") {
        console.log(`Batch #${ind} send successfully`);
      } else {
        console.error(`Batch #${ind} sending failed. Reason: ${result.reason}`);
      }
    });

    const copyResult = await s3Client.send(
      new CopyObjectCommand({
        CopySource: `${s3File.bucket.name}/${s3File.object.key}`,
        Bucket: s3File.bucket.name,
        Key: `parsed/${s3File.object.key.split("/").slice(-1)}`
      })
    );

    if (copyResult.$metadata.httpStatusCode !== 200) {
      throw new Error("Error while copying object!");
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: s3File.bucket.name,
        Key: s3File.object.key
      })
    );

    return buildResponse(201, {
      message: `File successfully parsed`
    });
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    return buildResponse(statusCode, {
      message: error instanceof Error ? error.message : "Smth went wrong"
    });
  }
};
