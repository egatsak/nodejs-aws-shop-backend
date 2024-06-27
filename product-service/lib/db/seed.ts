import { randomUUID } from "node:crypto";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { Product, Stock } from "../types";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../constants";
import "dotenv/config";

const dbClient = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    sessionToken: process.env.AWS_SESSION_TOKEN ?? "",
  },
});
const dbDocumentClient = DynamoDBDocumentClient.from(dbClient);

const products: Product[] = [
  {
    description: "Short Product Description1",
    id: randomUUID(),
    price: 24,
    title: "ProductOne",
  },
  {
    description: "Short Product Description7",
    id: randomUUID(),
    price: 15,
    title: "ProductTitle",
  },
  {
    description: "Short Product Description2",
    id: randomUUID(),
    price: 23,
    title: "Product",
  },
  {
    description: "Short Product Description4",
    id: randomUUID(),
    price: 15,
    title: "ProductTest",
  },
  {
    description: "Short Product Description1",
    id: randomUUID(),
    price: 23,
    title: "Product2",
  },
  {
    description: "Short Product Description7",
    id: randomUUID(),
    price: 15,
    title: "ProductName",
  },
];

const stocks: Stock[] = products.map(
  (prod) =>
    ({
      count: Math.floor(Math.random() * 11), // random integer from 1 to 10
      product_id: prod.id,
    }) satisfies Stock
);

Promise.all([
  dbDocumentClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [PRODUCTS_TABLE_NAME]: products.map((product) => ({
          PutRequest: {
            Item: product,
          },
        })),
      },
    })
  ),
  dbDocumentClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [STOCKS_TABLE_NAME]: stocks.map((stock) => ({
          PutRequest: {
            Item: stock,
          },
        })),
      },
    })
  ),
])
  .then(() => {
    console.log("seed successful");
  })
  .catch((e) => {
    console.log("Seed error/n", e);
  });
