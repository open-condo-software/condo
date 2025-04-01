# ApolloQueryBlockingPlugin

> With this plugin you can block a particular request / mutation in the API in case of an incident 
> without re-deploying the application.

## Working principle
1. Queries and mutations are extracted from each request.
2. If some query / mutation from the request is in the block list, the entire request will be rejected

## Configuring

You can find full config spec in [config.utils.specs.js](./config.utils.spec.js), but here's some brief example:
```dotenv
BLOCKED_OPERATIONS='{"queries": ["allResidentBillingReceipts"], "mutations": ["registerMultiPayment"]}'
```
