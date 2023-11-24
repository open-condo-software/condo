const { Integer } = require('@keystonejs/fields')
const isEmpty = require('lodash/isEmpty')
const nextCookies = require('next-cookies')
const pluralize = require('pluralize')
const validate = require('validate.js')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { Json } = require('@open-condo/keystone/fields')
const { composeNonResolveInputHook, composeResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { plugin } = require('@open-condo/keystone/plugins/utils/typing')

const DV_VERSION_MISMATCH_ERROR = {
    variable: ['data', 'dv'],
    code: BAD_USER_INPUT,
    type: 'DV_VERSION_MISMATCH',
    message: 'Wrong value for data version number',
}

const SENDER_FIELD_CONSTRAINTS = {
    fingerprint: {
        presence: true,
        format: /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/,
        length: { minimum: 5, maximum: 42 },
    },
    dv: {
        numericality: {
            noStrings: true,
            equalTo: 1,
        },
    },
}

const WRONG_SENDER_FORMAT_ERROR = {
    variable: ['data', 'sender'],
    code: BAD_USER_INPUT,
    type: 'WRONG_FORMAT',
    message: 'Invalid format of "sender" field value. {details}',
    correctExample: '{ dv: 1, fingerprint: \'example-fingerprint-alphanumeric-value\'}',
}

function checkDvAndSender (data, dvError, senderError, context) {
    if (!dvError || isEmpty(dvError)) throw new Error('checkDvAndSender(): wrong dvError argument')
    if (!senderError || isEmpty(senderError)) throw new Error('checkDvAndSender(): wrong senderError argument')
    if (!context) throw new Error('checkDvAndSender(): wrong context argument')
    if (!dvError.mutation && !dvError.query) throw new Error('checkDvAndSender(): dvError.mutation/dvError.query missing')
    if (!senderError.mutation && !senderError.query) throw new Error('checkDvAndSender(): senderError.mutation/senderError.query missing')

    const { dv, sender } = data

    if (dv !== 1) {
        throw new GQLError({ ...DV_VERSION_MISMATCH_ERROR, ...dvError }, context)
    }

    const senderErrors = validate(sender, SENDER_FIELD_CONSTRAINTS)
    if (senderErrors && Object.keys(senderErrors).length) {
        const details = Object.keys(senderErrors).map(field => {
            return `${field}: [${senderErrors[field].map(error => `'${error}'`).join(', ')}]`
        }).join(', ')

        throw new GQLError({ ...WRONG_SENDER_FORMAT_ERROR, messageInterpolation: { details }, ...senderError }, context)
    }
}

const dvAndSender = () => plugin(({ fields = {}, hooks = {}, ...rest }) => {
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
            'Example `{ "dv": 1, "fingerprint": "ExF1n6eRAz" }`. ' +
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

    const newResolveInput = ({ resolvedData, operation, context }) => {
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

    const newValidateInput = ({ resolvedData, context, operation, listKey, itemId }) => {
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
        checkDvAndSender(resolvedData, error, error, context)
    }

    const originalValidateInput = hooks.validateInput
    hooks.validateInput = composeNonResolveInputHook(originalValidateInput, newValidateInput)

    return { fields, hooks, ...rest }
})

module.exports = {
    dvAndSender,
    checkDvAndSender,
}
