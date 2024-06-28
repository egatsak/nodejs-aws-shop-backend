import { SQSEvent } from "aws-lambda";

export const handler = async (event: SQSEvent) => {
  console.log(`Products: ${event.Records}`);

  try {
    // parse products from SQS
  } catch (e) {
    console.log(`catalogBatchProcess failed`);
  }
};
