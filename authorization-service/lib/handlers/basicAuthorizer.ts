import {APIGatewayAuthorizerEvent, APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent} from "aws-lambda";

export const handler = async function (event: APIGatewayAuthorizerEvent): Promise<APIGatewayAuthorizerResult> {
  const [keys, values] = Object.entries(event);
  for (let i = 0; i < keys.length; i++) {
    console.log(keys[i], values[i]);
  }
  console.log(`Authorizer event: ${event.type} , ${event.methodArn}, ${event}`);

  /* const decodedToken = Buffer.from(event.authorizationToken, "base64").toString("utf-8");
  console.log(decodedToken);
  const token = decodedToken.split(" ")[1];
  console.log(token);

  const [username, password] = token.split(":");
 */
  const isVerified = true; /* username === "egatsak" && password === process.env.egatsak; */

  if (isVerified) {
    console.log("Access granted to user=" + "username");
    return Promise.resolve({
      principalId: "username",
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
  } else {
    console.log("Access denied to user=" + "username");
    return Promise.resolve({
      principalId: "username",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn
          }
        ]
      }
    } satisfies APIGatewayAuthorizerResult);
  }
};
