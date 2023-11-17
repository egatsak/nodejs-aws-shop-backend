# NODEJS AWS SHOP BACKEND

AWS Serverless API built using AWS CDK + Typescript, AWS Lambda, AWS API Gateway.

Frontend part deployed at AWS CloudFront is connected to the API built using AWS Lambdas & API Gateway (two separate Lambdas)

## Deploy links

### CloudFront

[Frontend App deploy link](https://d3a8fy38awxpqr.cloudfront.net/)

### API

[{{URL}}/products](https://2vrehcwum5.execute-api.eu-north-1.amazonaws.com/products) - returns JSON with hardcoded products array

[{{URL}}/products/{id}](https://2vrehcwum5.execute-api.eu-north-1.amazonaws.com/products/855e9a53-dd3c-46b8-8cb1-329f133146f6) - returns JSON with a single product

[{{URL}}/products/non-existing-id](https://2vrehcwum5.execute-api.eu-north-1.amazonaws.com/products/some-random-id) - returns 404 status code & 'Product Not Found' error message

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npm run cdk:bootstrap` provisioning resources for the AWS CDK before deploying AWS CDK apps into an AWS environment
* `npm run cdk:deploy`      deploy this stack to your default AWS account/region
* `npm run cdk:destroy` destroys AWS stack & deletes Lambdas, API Gateway & CloudFormation stack
