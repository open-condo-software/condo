# @open-condo/webhooks

## Table of contents
[Installation](#installation)\
[Environment Configuration](#environment-configuration)

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

## Environment Configuration

**IMPORTANT:** Apps using `@open-condo/webhooks` **must** have the following environment variables configured:
- `DATA_ENCRYPTION_CONFIG` - Encryption configuration for `EncryptedText` fields
- `DATA_ENCRYPTION_VERSION_ID` - Version identifier for the encryption configuration

The `WebhookPayload` schema uses `EncryptedText` fields for storing sensitive data (webhook payload and secret). The `EncryptionManager` is instantiated at module load time when the webhooks schema is imported, which requires both environment variables to be present.

### Why is this required?

- The `payload` and `secret` fields in `WebhookPayload` are encrypted at rest using `EncryptedText`
- The encryption manager is initialized when `@open-condo/webhooks/schema` is loaded
- **This happens even during migrations**, so the environment variable must be present in all environments (development, CI/CD, production)

### What happens without it?

If `DATA_ENCRYPTION_CONFIG` is not set, your app will fail to start with:
```
Error: env DATA_ENCRYPTION_CONFIG is not present
    at EncryptionManager._initializeDefaults
    at new EncryptionManager
    at Object.<anonymous> (/app/packages/webhooks/utils/encryption.js:3:27)
```

This error will occur:
- During app startup
- During database migrations (`makemigrations`, `migrate`)
- In CI/CD pipelines
- In any process that loads the Keystone schema

### Configuration Example

Ensure both `DATA_ENCRYPTION_CONFIG` and `DATA_ENCRYPTION_VERSION_ID` are set in your environment:

```bash
# .env file or environment variables
DATA_ENCRYPTION_CONFIG='{"your-app_1":{"algorithm":"aes-256-gcm","secret":"your-32-character-secret-string","compressor":"brotli","keyDeriver":"pbkdf2-sha512"}}'
DATA_ENCRYPTION_VERSION_ID='your-app_1'
```

**Important notes:**
- The `DATA_ENCRYPTION_CONFIG` is a JSON object where keys are version identifiers (e.g., `your-app_1`)
- The `DATA_ENCRYPTION_VERSION_ID` specifies which version from the config to use
- The `secret` must be a 32-character string (for aes-256-gcm)
- Use `algorithm: "aes-256-gcm"`, `compressor: "brotli"`, and `keyDeriver: "pbkdf2-sha512"` for consistency

The encryption configuration matches the format used by `@open-condo/keystone/crypto/EncryptionManager`. For local development, the `bin/prepare.js` script automatically generates these values.
