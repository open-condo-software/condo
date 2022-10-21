const { GQL_SCHEMA_PLUGIN } = require('@condo/keystone/plugins/utils/typing')
const { composeNonResolveInputHook } = require('@condo/keystone/plugins/utils')

const plugin = (fn) => {
    fn._type = GQL_SCHEMA_PLUGIN
    return fn
}

const webHooked = (validator) => plugin(({ hooks = {}, ...rest }, { schemaName }) => {
    if (validator.models.includes(schemaName)) {
        return
    }

    validator.registerModel(schemaName)
    const { afterChange: originalHook, ...restHooks } = hooks

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