# @open-condo/webhooks

## Table of contents
[Installation](#installation)\

## Installation
To install webhooks extension to your `Keystone5` app, first add it as a dependency via your package :
```bash
yarn add @open-condo/webhooks
```

After that, you need to register 2 additional schemas in your entry point 
and specify, where your GQL schema is stored.
> For now schema is supported only as local `.graphql` files
```javascript
const { getWebhookModels } = require('@open-condo/webhooks/schema')

registerSchemas(keystone, [
    // ...
    getWebhookModels('<path-to-your-schema>.graphql')
])
```

And finally, add `webHooked` plugin to any desired model:
```javascript
const { webHooked } = require('@open-condo/webhooks/plugins')
```
