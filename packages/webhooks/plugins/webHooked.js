const { GQL_SCHEMA_PLUGIN } = require('@condo/keystone/plugins/utils/typing')
const { composeNonResolveInputHook } = require('@condo/keystone/plugins/utils')
const { getModelValidator } = require('@condo/webhooks/model-validator')

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
        // NOTE: task.delay() is async method, so need to use async here
        // TODO(DOMA-4412) Launch sync task here
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