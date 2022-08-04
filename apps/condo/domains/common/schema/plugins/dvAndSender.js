const pluralize = require('pluralize')
const nextCookies = require('next-cookies')

const { composeNonResolveInputHook, composeResolveInputHook } = require('@core/keystone/plugins/utils')
const { plugin } = require('@core/keystone/plugins/utils/typing')

const { checkDvSender } = require('@condo/domains/common/utils/serverSchema/validators')
const { Integer } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')

const dvAndSender = ({ dvField, senderField } = {}) => plugin(({ fields = {}, hooks = {}, ...rest }) => {
    const dvField = 'dv'
    const senderField = 'sender'

    fields[dvField] = {
        type: Integer,
        schemaDoc: 'Data structure Version',
        isRequired: true,
        kmigratorOptions: { null: false },
    }
    fields[senderField] = {
        type: Json,
        schemaDoc: 'Client-side device identification used for the anti-fraud detection. ' +
            'Example `{ dv: 1, fingerprint: \'VaxSw2aXZa\'}`. ' +
            'Where the `fingerprint` should be the same for the same devices and it\'s not linked to the user ID. ' +
            'It\'s the device ID like browser / mobile application / remote system',
        graphQLInputType: 'SenderFieldInput',
        graphQLReturnType: 'SenderField',
        graphQLAdminFragment: '{ dv fingerprint }',
        extendGraphQLTypes: [
            'type SenderField { dv: Int!, fingerprint: String! }',
            'input SenderFieldInput { dv: Int!, fingerprint: String! }',
        ],
        isRequired: true,
        kmigratorOptions: { null: false },
    }

    const newResolveInput = ({ resolvedData, existingItem, operation, context }) => {
        if ((operation === 'create' || operation === 'update') && context.req) {
            const cookies = nextCookies({ req: context.req })
            if (!resolvedData.hasOwnProperty(dvField) && cookies.hasOwnProperty(dvField)) {
                let parsed = parseInt(cookies[dvField])
                if (!isNaN(parsed)) {
                    resolvedData[dvField] = parsed
                }
            }
            if (!resolvedData.hasOwnProperty(senderField) && cookies.hasOwnProperty(senderField)) {
                let parsed = (cookies[senderField])
                if (parsed) {
                    resolvedData[senderField] = parsed
                }
            }
        }
        return resolvedData
    }
    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeResolveInputHook(originalResolveInput, newResolveInput)

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
