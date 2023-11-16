export const buildResponse = (
  statusCode: number,
  body: Record<string, unknown>
) => {
  return {
    statusCode,
    headers: {
      "Accept-Control-Allow-Credentials": true,
      "Accept-Control-Allow-Origin": "*",
      "Accept-Control-Allow-Headers": "*",
    },
    body: JSON.stringify(body),
  };
};
