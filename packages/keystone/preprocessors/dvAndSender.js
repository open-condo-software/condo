const { GQL_LIST_SCHEMA_TYPE } = require('@condo/keystone/schema')
const { Integer } = require('@keystonejs/fields')
const { Json } = require('@condo/keystone/fields')
const { composeNonResolveInputHook, composeResolveInputHook } = require('@condo/keystone/preprocessors/utils/dvAndSender.helper')
const { newResolveInput, newValidateInput } = require('@condo/keystone/preprocessors/utils/dvAndSender.helper')

const dvField = {
    dv: {
        type: Integer,
        schemaDoc: 'Data structure Version',
        isRequired: true,
        kmigratorOptions: { null: false },
    },
}
const senderField = {
    sender: {
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
    },
}

const dvAndSenderPreprocessor = (schemaType, name, schema) => {
    if (schemaType !== GQL_LIST_SCHEMA_TYPE) {
        return schema
    } else {
        if (schema.hasOwnProperty('hooks')) {
            const originalResolveInput = schema.hooks.resolveInput
            const transformedResolveInput = composeResolveInputHook(originalResolveInput, newResolveInput)
            const originalValidateInput = schema.hooks.validateInput
            const transformedValidateInput = composeNonResolveInputHook(originalValidateInput, newValidateInput)
            return {
                ...schema,
                ...dvField,
                ...senderField,
                ...transformedResolveInput,
                ...transformedValidateInput,
            }
        }
        return schema
    }
}

module.exports = {
    dvAndSenderPreprocessor,
}