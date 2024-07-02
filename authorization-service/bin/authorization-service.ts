#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import {AuthorizationServiceStack} from "../lib/authorization-service-stack";
import "dotenv/config";

const app = new cdk.App();
new AuthorizationServiceStack(app, "AuthorizationServiceStack", {
  env: {
    region: process.env.AWS_REGION ?? "us-east-1"
  }
});
