import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";

const userName = process.env.USER_NAME ?? "";
const password = process.env[userName] ?? "";

export const handler = (event: APIGatewayTokenAuthorizerEvent) => {
  const authToken = event.authorizationToken.split(" ")[1];

  const buffer = Buffer.from(authToken, "base64");
  const [user, pass] = buffer.toString("utf-8").split(":");

  const isCorrectCredentials = userName === user && pass === password;

  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "BasicAuthorizerPolicy",
        Effect: isCorrectCredentials ? "Allow" : "Deny",
        Action: ["execute-api:Invoke"],
        Resource: event.methodArn,
      },
    ],
  };

  return policy;
};
