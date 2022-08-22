const { get } = require('lodash')

const { GQL_LIST_SCHEMA_TYPE } = require('@condo/keystone/schema')
const {
    composeNonResolveInputHook,
    composeResolveInputHook,
    newResolveInput,
    newValidateInput,
} = require('./utils/dvAndSender.helper')

const dvField = {
    type: 'Integer',
    schemaDoc: 'Data structure Version',
    isRequired: true,
    kmigratorOptions: { null: false },
}

const senderField = {
    type: 'Json',
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

const dvAndSenderPreprocessor = (schemaType, name, schema) => {
    if (schemaType !== GQL_LIST_SCHEMA_TYPE) {
        return schema
    } else {
        // NOTE: historical schema already have dv and sender fields!
        if (name.endsWith('HistoryRecord')) return schema

        const hooks = get(schema, 'hooks', {})
        const fields = schema.fields

        fields['dv'] = dvField
        fields['sender'] = senderField

        const originalResolveInput = hooks.resolveInput
        hooks.resolveInput = composeResolveInputHook(originalResolveInput, newResolveInput)

        const originalValidateInput = hooks.validateInput
        hooks.validateInput = composeNonResolveInputHook(originalValidateInput, newValidateInput)
        return schema
    }
}

module.exports = {
    dvAndSenderPreprocessor,
}