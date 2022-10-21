const path = require('path')
const { WebHookModelValidator } = require('@condo/webhooks/model-validator')

const schemaPath = path.resolve(__dirname, '..', 'schema.graphql')

const webhookModelValidator = new WebHookModelValidator(schemaPath)

module.exports = {
    webhookModelValidator,
}
