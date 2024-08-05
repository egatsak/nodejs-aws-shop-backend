import {APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent} from "aws-lambda";

export const handler = async function (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> {
  console.log(`Authorizer event: ${event.type} , ${event.methodArn}, ${event.path}, ${event.headers?.authorization}`);

  const payload = event.headers?.authorization;

  try {
    if (payload) {
      const [bearer, token] = payload.split(" ");
      if (bearer !== "Basic") {
        throw new Error(`Incorrect Authorization header format! Accepted format is "Basic Token"`);
      }
      const decodedToken = Buffer.from(token, "base64").toString("utf-8");

      const [username, password] = decodedToken.split(":");

      if (username !== "egatsak") {
        throw new Error(`unknown user!`);
      }

      const isVerified = password === process.env.egatsak;

      if (isVerified) {
        console.log("Access granted to user=" + "username");

        return Promise.resolve({
          principalId: "egatsak",
          policyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Action: "execute-api:Invoke",
                Effect: "Allow",
                Resource: event.methodArn
              }
            ]
          }
        } satisfies APIGatewayAuthorizerResult);
      }
    }

    console.log("Access denied to user=" + "username");

    return Promise.resolve({
      principalId: "egatsak",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn
          }
        ]
      },
      context: {
        reason: `Incorrect password`
      }
    } satisfies APIGatewayAuthorizerResult);
  } catch (e) {
    console.log(e);
    console.log("Access denied to user= unknownUser");
    return Promise.resolve({
      principalId: "unknownUser",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn
          }
        ]
      },
      context: {
        reason: e instanceof Error ? e?.message : `Unknown error`
      }
    } satisfies APIGatewayAuthorizerResult);
  }
};
