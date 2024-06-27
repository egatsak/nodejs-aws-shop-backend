import { QueryCommandOutput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb";

export type MyQueryCommandOutput<T> = Omit<QueryCommandOutput, "Items"> & {
  Items?: T;
};

export type MyScanCommandOutput<T> = Omit<ScanCommandOutput, "Items"> & {
  Items?: T;
};
