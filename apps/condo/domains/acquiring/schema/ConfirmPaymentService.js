const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/acquiring/access/RecordManualRentPaymentService')
const { confirmPayment } = require('@condo/domains/acquiring/utils/serverSchema')
const { DV_VERSION_MISMATCH, REQUIRED, WRONG_FORMAT } = require('@condo/domains/common/constants/errors')

const ERRORS = {
    DV_VERSION_MISMATCH: {
        mutation: 'confirmPayment',
        variable: ['data', 'dv'],
        code: BAD_USER_INPUT,
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
    WRONG_SENDER_FORMAT: {
        mutation: 'confirmPayment',
        variable: ['data', 'sender'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid format of "sender" field value. {details}',
        correctExample: '{ "dv": 1, "fingerprint": "uniq-device-or-container-id" }',
        messageInterpolation: { details: 'Please, check the example for details' },
    },
    REQUIRED_PROVIDER: {
        mutation: 'confirmPayment',
        variable: ['data', 'provider'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'Provider is required for payment confirmation',
    },
    REQUIRED_PROVIDER_REFERENCE: {
        mutation: 'confirmPayment',
        variable: ['data', 'providerReference'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'Provider reference is required for payment confirmation',
    },
    REQUIRED_EXTERNAL_TRANSACTION_ID: {
        mutation: 'confirmPayment',
        variable: ['data', 'externalTransactionId'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'External transaction id is required for payment confirmation',
    },
    REQUIRED_AMOUNT: {
        mutation: 'confirmPayment',
        variable: ['data', 'amount'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'Amount is required for payment confirmation',
    },
    REQUIRED_CURRENCY_CODE: {
        mutation: 'confirmPayment',
        variable: ['data', 'currencyCode'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'Currency code is required for payment confirmation',
    },
}

const ConfirmPaymentService = new GQLCustomSchema('ConfirmPaymentService', {
    types: [
        {
            access: true,
            type: 'input ConfirmPaymentInput { dv: Int!, sender: SenderFieldInput!, provider: String!, providerReference: String!, externalTransactionId: String!, amount: String!, currencyCode: String!, confirmedAt: String }',
        },
        {
            access: true,
            type: 'type ConfirmPaymentOutput { payment: Payment!, allocations: [PaymentAllocation!]!, receipt: PaymentReceipt!, ledgerBalance: String! }',
        },
    ],

    mutations: [
        {
            access: access.canConfirmPayment,
            schema: 'confirmPayment(data: ConfirmPaymentInput!): ConfirmPaymentOutput',
            resolver: async (parent, args, context) => {
                const { data } = args

                checkDvAndSender(data, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

                if (!String(data.provider || '').trim()) {
                    throw new GQLError(ERRORS.REQUIRED_PROVIDER, context)
                }

                if (!String(data.providerReference || '').trim()) {
                    throw new GQLError(ERRORS.REQUIRED_PROVIDER_REFERENCE, context)
                }

                if (!String(data.externalTransactionId || '').trim()) {
                    throw new GQLError(ERRORS.REQUIRED_EXTERNAL_TRANSACTION_ID, context)
                }

                if (!String(data.amount || '').trim()) {
                    throw new GQLError(ERRORS.REQUIRED_AMOUNT, context)
                }

                if (!String(data.currencyCode || '').trim()) {
                    throw new GQLError(ERRORS.REQUIRED_CURRENCY_CODE, context)
                }

                return await confirmPayment(context, data)
            },
        },
    ],
})

module.exports = {
    ConfirmPaymentService,
}
