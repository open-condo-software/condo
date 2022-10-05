const { composeNonResolveInputHook } = require('@condo/keystone/plugins/utils')
const { plugin } = require('@condo/keystone/plugins/utils/typing')

const { REGISTERED_WEBHOOK_MODELS } = require('../../constants')

const webhook = () => plugin(({ hooks = {}, ...rest }, { schemaName }) => {
    if (REGISTERED_WEBHOOK_MODELS.includes(schemaName)) return

    REGISTERED_WEBHOOK_MODELS.push(schemaName)

    const afterChange = async ({ updatedItem, existingItem, context, operation, originalInput }) => {
        // TODO(pahaz): write the logic!
    }

    const originalAfterChange = hooks.afterChange
    hooks.afterChange = composeNonResolveInputHook(originalAfterChange, afterChange)
    return { hooks, ...rest }
})

module.exports = {
    webhook,
}
