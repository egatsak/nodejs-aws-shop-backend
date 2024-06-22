export const buildResponse = (statusCode: number, body: unknown) => {
  return {
    statusCode,
    headers: {
      "Accept-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Accept-Control-Allow-Headers": "*",
    },
    body: JSON.stringify(body),
  };
};
