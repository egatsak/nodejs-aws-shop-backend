import { randomUUID } from "node:crypto";
import { SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { buildResponse } from "../utils";
import { ProductDto, productDtoSchema } from "../dto";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

export const catalogBatchProcess = async (event: SQSEvent) => {
  console.log("catalogBatchProcess: ", event);

  try {
    const dynamoDb = new DynamoDBClient({
      region: "eu-north-1",
    });

    const snsClient = new SNSClient();

    const createdProducts = await Promise.all(
      event.Records.map(async (record) => {
        const productDto = JSON.parse(record.body ?? "") as ProductDto;

        await productDtoSchema.validateAsync(productDto);

        const { count, ...product } = productDto;
        const productId = randomUUID();

        const productToDb = { ...product, id: productId };

        const stockToDb = {
          product_id: productId,
          count: count,
          id: randomUUID(),
        };

        await dynamoDb.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Put: {
                  TableName: "Products",
                  Item: productToDb,
                },
              },
              {
                Put: {
                  TableName: "Stocks",
                  Item: stockToDb,
                },
              },
            ],
          })
        );

        return {
          ...productDto,
          id: productId,
        };
      })
    );

    await Promise.all(
      createdProducts.map(async (createdProduct) => {
        return snsClient.send(
          new PublishCommand({
            Message: `Product imported from CSV file. ID: ${createdProduct?.id}`,
            TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
            MessageAttributes: {
              price: {
                DataType: "Number",
                StringValue: `${createdProduct?.price}`,
              },
            },
          })
        );
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
