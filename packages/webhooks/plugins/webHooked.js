const { composeNonResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { GQL_SCHEMA_PLUGIN } = require('@open-condo/keystone/plugins/utils/typing')
const { WEBHOOK_SYNC_DELAY_IN_SEC } = require('@open-condo/webhooks/config')
const { getModelValidator } = require('@open-condo/webhooks/model-validator')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const plugin = (fn) => {
    fn._type = GQL_SCHEMA_PLUGIN
    return fn
}

const webHooked = () => plugin((schema, { schemaName }) => {
    const validator = getModelValidator()
    if (!validator || validator.models.includes(schemaName)) {
        return schema
    }

    validator.registerModel(schemaName)
    const { hooks: { afterChange: originalHook, ...restHooks }, ...rest } = schema

    const syncAfterChange = async () => {
        const { sendModelWebhooks } = getWebhookTasks()
        await sendModelWebhooks.applyAsync([schemaName], null, {
            delay: WEBHOOK_SYNC_DELAY_IN_SEC * 1000,
        })
    }

    const afterChange = composeNonResolveInputHook(originalHook, syncAfterChange)

    return {
        hooks: {
            afterChange,
            ...restHooks,
        },
        ...rest,
    }
})

module.exports = {
    webHooked,
}
