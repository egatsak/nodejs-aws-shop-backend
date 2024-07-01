import { SQSEvent, SQSRecord } from "aws-lambda";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { dbDocumentClient } from "../../lib/db/client";
import { handler } from "../../lib/handlers/catalogBatchProcess";

const ddbMock = mockClient(dbDocumentClient);
const snsMock = mockClient(SNSClient);

describe("catalogBatchProcess", () => {
  beforeEach(() => {
    ddbMock.reset();
    snsMock.reset();
    jest.clearAllMocks();
  });

  test("should process products and publish SNS message", async () => {
    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Product 1",
            description: "Description 1",
            price: 120,
            count: 10,
          }),
        } as SQSRecord,
      ],
    };

    ddbMock.on(TransactWriteCommand).resolves({});

    snsMock.on(PublishCommand).resolves({
      MessageId: "test-message-id",
    });

    await handler(event);

    expect(ddbMock).toHaveReceivedCommandTimes(TransactWriteCommand, 1);
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 1);

    expect(snsMock).toHaveReceivedCommandWith(PublishCommand, {
      TopicArn: process.env.SNS_TOPIC_ARN ?? "",
      Subject: `New products from CSV parse have been added to DB successfully.`,
      Message: `Products:
[${JSON.stringify({
        title: "Product 1",
        description: "Description 1",
        price: 120,
        count: 10,
      })}]`,
      MessageAttributes: {
        expensive: {
          DataType: "Number",
          StringValue: "1",
        },
      },
    });
  });

  test("should not publish SNS message if no products are provided", async () => {
    const event: SQSEvent = {
      Records: [],
    };

    await handler(event);

    expect(ddbMock).toHaveReceivedCommandTimes(TransactWriteCommand, 0);
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 0);
  });

  test("should handle errors gracefully", async () => {
    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Product 1",
            description: "Description 1",
            price: 120,
            count: 10,
          }),
        } as SQSRecord,
      ],
    };

    ddbMock.on(TransactWriteCommand).rejects(new Error("DynamoDB error"));

    console.log = jest.fn();

    await handler(event);

    expect(ddbMock).toHaveReceivedCommandTimes(TransactWriteCommand, 1);
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 0);

    expect(console.log).toHaveBeenCalledWith(`catalogBatchProcess failed`);
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });
});
