export const buildResponse = (statusCode: number, body: unknown) => {
  return {
    statusCode,
    headers: {
      "Accept-Control-Allow-Credentials": true,
      "Accept-Control-Allow-Origin": "*",
      "Accept-Control-Allow-Headers": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
};
