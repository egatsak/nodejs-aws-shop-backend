import * as cdk from "aws-cdk-lib";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";
import { stageName } from "./constants";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { JsonSchemaType, Model } from "aws-cdk-lib/aws-apigateway";
import {
  Distribution,
  ResponseHeadersPolicy,
} from "aws-cdk-lib/aws-cloudfront";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importServiceBucket = new s3.Bucket(this, "ImportServiceS3Bucket", {
      bucketName: "egatsak-import-service-bucket",
      cors: [
        {
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.DELETE,
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          exposedHeaders: [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers",
          ],
        },
      ],
      /*      autoDeleteObjects: true,
     removalPolicy: RemovalPolicy.DESTROY, */
    });

    /* importServiceBucket.addCorsRule({
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
      allowedMethods: [
        s3.HttpMethods.DELETE,
        s3.HttpMethods.GET,
        s3.HttpMethods.HEAD,
        s3.HttpMethods.POST,
        s3.HttpMethods.PUT,
      ],
      exposedHeaders: [
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers",
      ],
    }); */

    const bucketUploadedPolicy = new PolicyStatement({
      actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      resources: [importServiceBucket.arnForObjects(`uploaded/*`)],
      effect: Effect.ALLOW,
    });

    const bucketParsedPolicy = new PolicyStatement({
      actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      resources: [importServiceBucket.arnForObjects(`parsed/*`)],
      effect: Effect.ALLOW,
    });

    const sharedLambdaProps: NodejsFunctionProps = {
      runtime: Runtime.NODEJS_20_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
        BUCKET_NAME: importServiceBucket.bucketName,
      },
    };

    const importProductsFileFunction = new NodejsFunction(
      this,
      "ImportProductsFileLambda",
      {
        ...sharedLambdaProps,
        entry: "lib/handlers/importProductsFile.ts",
        functionName: "importProductsFile",
      }
    );

    importProductsFileFunction.addToRolePolicy(bucketUploadedPolicy);

    importServiceBucket.grantReadWrite(importProductsFileFunction);

    const importsApiGateway = new apiGateway.RestApi(
      this,
      "ImportsApiGateway",
      {
        restApiName: "Import Service",
        defaultCorsPreflightOptions: {
          allowHeaders: ["*"],
          allowOrigins: ["*"],
          allowMethods: apiGateway.Cors.ALL_METHODS,
          exposeHeaders: [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers",
          ],
        },
        deployOptions: {
          stageName: stageName,
        },
      }
    );

    const lambdaIntegration = new apiGateway.LambdaIntegration(
      importProductsFileFunction,
      {
        requestParameters: {
          "integration.request.querystring.name":
            "method.request.querystring.name",
        },
        /* integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": '{"message": "Hello World!"}',
            },
            responseParameters: {
              // 👇 allow CORS for all origins
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Headers":
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              "method.response.header.Access-Control-Allow-Methods":
                "'OPTIONS,GET,PUT,POST,DELETE'",
            },
          },
          {
            statusCode: "400",
               responseTemplates: {
              "application/json": '{"message": "Hello World!"}',
            }, 
            responseParameters: {
              // 👇 allow CORS for all origins
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Headers":
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              "method.response.header.Access-Control-Allow-Methods":
                "'OPTIONS,GET,PUT,POST,DELETE'",
            },
          },
        ],
        requestTemplates: {
          "application/json": '{"statusCode": 200}',
        }, */
      }
    );

    const resource = importsApiGateway.root.addResource("import", {
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowHeaders: ["*"],
        allowMethods: apiGateway.Cors.ALL_METHODS,
        exposeHeaders: [
          "Access-Control-Allow-Origin",
          "Access-Control-Allow-Methods",
          "Access-Control-Allow-Headers",
        ],
      },
    });

    const importProductsModel = new Model(this, "ImportProductsModel", {
      restApi: importsApiGateway,
      contentType: "application/json",
      modelName: "ImportProductsModel",
      schema: {
        title: "SignedUrl",
        type: JsonSchemaType.OBJECT,
        properties: {
          uploadUrl: { type: JsonSchemaType.STRING },
        },
        required: ["uploadUrl"],
      },
    });

    const importProductsErrorModel = new Model(
      this,
      "ImportProductsErrorModel",
      {
        restApi: importsApiGateway,
        contentType: "application/json",
        modelName: "ImportProductsErrorModel",
        schema: {
          title: "Error",
          type: JsonSchemaType.OBJECT,
          properties: {
            message: { type: JsonSchemaType.STRING },
          },
          required: ["message"],
        },
      }
    );

    resource.addMethod("GET", lambdaIntegration, {
      requestParameters: {
        "method.request.querystring.name": true,
      },

      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            "application/json": importProductsModel,
          },
          responseParameters: {
            // 👇 allow CORS for all origins
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
          },
        },
        {
          statusCode: "400",
          responseModels: {
            "application/json": importProductsErrorModel,
          },
          responseParameters: {
            // 👇 allow CORS for all origins
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
          },
        },
      ],
    });

    const importFileParserFunction = new NodejsFunction(
      this,
      "ImportFileParserLambda",
      {
        ...sharedLambdaProps,
        entry: "lib/handlers/importFileParser.ts",
        functionName: "importFileParser",
      }
    );

    importFileParserFunction.addToRolePolicy(bucketParsedPolicy);

    importServiceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserFunction),
      {
        prefix: "uploaded/",
        suffix: "csv",
      }
    );

    importServiceBucket.grantReadWrite(importFileParserFunction);
  }
}
