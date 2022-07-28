const { isEmpty } = require('lodash')
const validate = require('validate.js')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')

const { DV_VERSION_MISMATCH, WRONG_FORMAT } = require('@condo/domains/common/constants/errors')

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
    if (!dvError.mutation) throw new Error('checkDvSender(): dvError.mutation missing')
    if (!senderError.mutation) throw new Error('checkDvSender(): senderError.mutation missing')

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

module.exports = {
    checkDvSender,
}