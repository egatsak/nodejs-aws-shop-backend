# NODEJS AWS SHOP BACKEND

AWS Serverless API built using AWS CDK + Typescript, AWS API Gateway, AWS Lambda, AWS DynamoDB, AWS S3.

Frontend part deployed at AWS CloudFront is connected to the API built using AWS Lambdas, AWS DynamoDB, AWS S3 & AWS API Gateway

## Deploy links

### CloudFront

[Frontend App deploy link](https://dosfklikrk6wd.cloudfront.net/)

### Products API

GET [{{URL}}/products](https://km96rjp673.execute-api.us-east-1.amazonaws.com/products) - returns JSON with products array queried from a DynamoDB table

GET [{{URL}}/products/{id}](https://km96rjp673.execute-api.us-east-1.amazonaws.com/products/855e9a53-dd3c-46b8-8cb1-329f133146f6) - returns JSON with a single product from a DynamoDB table

GET [{{URL}}/products/non-existing-id](https://km96rjp673.execute-api.us-east-1.amazonaws.com/products/some-random-id) - returns 404 status code & 'Product Not Found' error message

POST [{{URL}}/products](https://km96rjp673.execute-api.us-east-1.amazonaws.com/products/some-random-id) - creates new product, inserts it into DynamoDB table and returns 201 status code & JSON with created product

### Import API

GET [{{URL}}/import?name=fileName.csv](https://i3jtq6hsag.execute-api.us-east-1.amazonaws.com/dev/import?name=fileName.csv) - returns JSON with a S3 Presigned Upload URL

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npm run cdk:bootstrap` provisioning resources for the AWS CDK before deploying AWS CDK apps into an AWS environment
* `npm run cdk:deploy`      deploy this stack to your default AWS account/region
* `npm run cdk:destroy` destroys AWS stack & deletes Lambdas, API Gateway & CloudFormation stack
* `npm run seed`    seeds database with fake products and stocks

## Extra

`openapi.json` files contain api docs
`insomnia_aws.json` contains Insomnia project for API testing (comes in handy for POST requests, for instance)

Cheers!

NB! ARN for authorizer lambda permission:
arn:aws:execute-api:{AWS_REGION}:{AWS_ACCOUNT_ID}:{ApiGateway_ARN}/authorizers/{Authorizer_Id}
Authorizer_Id can be taken from AWS Console (ApiGateway->Authorizers), and must be manually set in the console (Lambda->Configuration->Permissions)