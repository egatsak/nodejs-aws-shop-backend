import path from "node:path";
import { createReadStream } from "node:fs";
import { S3Event, S3EventRecord } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { sdkStreamMixin } from "@smithy/util-stream";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { handler } from "../lib/handlers/importFileParser";

describe("ImportFileParser - aws cdk client mock", () => {
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    s3Mock.reset();
  });

  test("Parse products from CSV file - using aws-sdk-client-mock", async () => {
    const fileStream = createReadStream(
      path.resolve(__dirname, "testProducts.csv")
    );

    const sdkStream = sdkStreamMixin(fileStream);

    s3Mock
      .on(GetObjectCommand, {
        Bucket: "MyBucketName",
        Key: "uploaded/123.csv",
      })
      .resolves({ Body: sdkStream });

    s3Mock
      .on(CopyObjectCommand, {
        Bucket: "MyBucketName",
        CopySource: `MyBucketName/uploaded/123.csv`,
        Key: "parsed/123.csv",
      })
      .resolves({ $metadata: { httpStatusCode: 200 } });

    s3Mock
      .on(DeleteObjectCommand, {
        Bucket: "MyBucketName",
        Key: "uploaded/123.csv",
      })
      .resolves({ $metadata: { httpStatusCode: 204 } });

    const event: S3Event = {
      Records: [
        <S3EventRecord>{
          s3: {
            bucket: { name: "MyBucketName" },
            object: { key: "uploaded/123.csv" },
          },
        },
      ],
    };

    const result = await handler(event);

    expect(s3Mock).toHaveReceivedCommand(GetObjectCommand);
    expect(s3Mock).toHaveReceivedCommand(CopyObjectCommand);
    expect(s3Mock).toHaveReceivedCommand(DeleteObjectCommand);

    expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: "MyBucketName",
      Key: "uploaded/123.csv",
    });

    expect(s3Mock).toHaveReceivedCommandWith(CopyObjectCommand, {
      Bucket: "MyBucketName",
      CopySource: `MyBucketName/uploaded/123.csv`,
      Key: "parsed/123.csv",
    });

    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
      Bucket: "MyBucketName",
      Key: "uploaded/123.csv",
    });

    expect(result.statusCode).toEqual(201);
  });
});
