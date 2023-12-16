export const buildResponse = (statusCode: number, body: unknown) => {
  return {
    statusCode,
    headers: {
      "Accept-Control-Allow-Origin": "*",
      "Accept-Control-Allow-Headers": "*",
      "Accept-Control-Allow-Methods": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
};
