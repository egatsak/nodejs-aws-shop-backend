import {APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent} from "aws-lambda";

export const handler = function (event: APIGatewayTokenAuthorizerEvent): APIGatewayAuthorizerResult {
  console.log(`Authorizer event: ${event}`);

  const token = event.authorizationToken.split(" ")[1];

  const decodedToken = Buffer.from(token, "base64").toString("utf-8");

  const [username, password] = decodedToken.split(":");

  const isVerified = username === "egatsak" && password === process.env.egatsak;

  if (isVerified) {
    console.log("Access granted to user=" + username);
    return {
      principalId: username,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "*"
          }
        ]
      }
    } satisfies APIGatewayAuthorizerResult;
  } else {
    console.log("Access denied to user=" + username);
    return {
      principalId: username,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*"
          }
        ]
      }
    } satisfies APIGatewayAuthorizerResult;
  }
};
