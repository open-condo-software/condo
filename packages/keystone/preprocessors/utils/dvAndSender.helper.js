const { isEmpty } = require('lodash')
const validate = require('validate.js')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@condo/keystone/errors')
const nextCookies = require('next-cookies')
const pluralize = require('pluralize')

const WRONG_FORMAT = 'WRONG_FORMAT'
const DV_VERSION_MISMATCH = 'DV_VERSION_MISMATCH'
const DV_FIELD = 'dv'
const SENDER_FIELD = 'sender'

const DV_VERSION_MISMATCH_ERROR = {
    variable: ['data', 'dv'],
    code: BAD_USER_INPUT,
    type: DV_VERSION_MISMATCH,
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
    type: WRONG_FORMAT,
    message: 'Invalid format of "sender" field value. {details}',
    correctExample: '{ dv: 1, fingerprint: \'example-fingerprint-alphanumeric-value\'}',
}

function checkDvSender (data, dvError, senderError, context) {
    if (!dvError || isEmpty(dvError)) throw new Error('checkDvSender(): wrong dvError argument')
    if (!senderError || isEmpty(senderError)) throw new Error('checkDvSender(): wrong senderError argument')
    if (!context) throw new Error('checkDvSender(): wrong context argument')
    if (!dvError.mutation && !dvError.query) throw new Error('checkDvSender(): dvError.mutation/dvError.query missing')
    if (!senderError.mutation && !senderError.query) throw new Error('checkDvSender(): senderError.mutation/senderError.query missing')

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

const composeResolveInputHook = (originalHook, newHook) => async params => {
    // NOTE(pahaz): resolveInput should return a new resolvedData!
    let { resolvedData } = params
    if (originalHook) {
        resolvedData = await originalHook(params)
    }
    return newHook({ ...params, resolvedData })
}
const newResolveInput = ({ resolvedData, operation, context }) => {
    if ((operation === 'create' || operation === 'update') && context.req) {
        const cookies = nextCookies({ req: context.req })
        if (!resolvedData.hasOwnProperty(DV_FIELD) && cookies.hasOwnProperty(DV_FIELD)) {
            let parsed = parseInt(cookies[DV_FIELD])
            if (!isNaN(parsed)) {
                resolvedData[DV_FIELD] = parsed
            }
        }
        if (!resolvedData.hasOwnProperty(SENDER_FIELD) && cookies.hasOwnProperty(SENDER_FIELD)) {
            let parsed = (cookies[SENDER_FIELD])
            if (parsed) {
                resolvedData[SENDER_FIELD] = parsed
            }
        }
    }
    return resolvedData
}

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
    checkDvSender(resolvedData, error, error, context)
}

const composeNonResolveInputHook = (originalHook, newHook) => async params => {
    // NOTE(pahaz): validateInput, beforeChange, afterChange and others hooks should ignore return value!
    if (originalHook) await originalHook(params)
    return newHook({ ...params })
}

module.exports = {
    checkDvSender,
    newValidateInput,
    newResolveInput,
    composeResolveInputHook,
    composeNonResolveInputHook,
}