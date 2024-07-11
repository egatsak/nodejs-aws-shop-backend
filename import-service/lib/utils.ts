export const buildResponse = (statusCode: number, body: unknown) => {
  return {
    statusCode,
    headers: {
      "Accept-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Accept-Control-Allow-Headers": "*"
    },
    body: JSON.stringify(body)
  };
};

export const createBatches = <T>(arr: T[], batchSize: number): T[][] => {
  const batchCount = Math.ceil(arr.length / batchSize);

  const batches = new Array(batchCount).fill(0).map((_, index) => {
    return arr.slice(index * batchSize, (index + 1) * batchSize);
  });

  return batches;
};
