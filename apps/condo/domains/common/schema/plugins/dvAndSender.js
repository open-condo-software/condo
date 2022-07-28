const pluralize = require('pluralize')
const { composeNonResolveInputHook } = require('@core/keystone/plugins/utils')
const { plugin } = require('@core/keystone/plugins/utils/typing')

const { SENDER_FIELD, DV_FIELD } = require('@condo/domains/common/schema/fields')
const { checkDvSender } = require('@condo/domains/common/utils/serverSchema/validators')

const dvAndSender = ({ requiredDv = 1 } = {}) => plugin(({ fields = {}, hooks = {}, ...rest }) => {
    const dvField = 'dv'
    const senderField = 'sender'

    fields[dvField] = DV_FIELD
    fields[senderField] = SENDER_FIELD

    const newValidateInput = ({ resolvedData, context, addValidationError, operation, listKey, itemId }) => {
        let key, name
        if (operation === 'read') {
            if (itemId) {
                key = 'query'
                name = listKey
            } else {
                key = 'query'
                name = 'all' + pluralize.plural(listKey)
            }
        } else {
            // TODO(pahaz): think about multipleCreate / Update / Delete
            key = 'mutation'
            name = `${operation}${listKey}`
        }
        const error = { [key]: name }
        checkDvSender(resolvedData, error, error, context)
    }

    const originalValidateInput = hooks.validateInput
    hooks.validateInput = composeNonResolveInputHook(originalValidateInput, newValidateInput)
    return { fields, hooks, ...rest }
})

module.exports = {
    dvAndSender,
}
