const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/acquiring/access/PublicRentPaymentService')
const { verifyPendingPaymentPublic } = require('@condo/domains/acquiring/utils/serverSchema')
const { DV_VERSION_MISMATCH, WRONG_FORMAT } = require('@condo/domains/common/constants/errors')

const ERRORS = {
    DV_VERSION_MISMATCH: {
        mutation: 'verifyPendingPayment',
        variable: ['data', 'dv'],
        code: BAD_USER_INPUT,
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
    WRONG_SENDER_FORMAT: {
        mutation: 'verifyPendingPayment',
        variable: ['data', 'sender'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid format of "sender" field value. {details}',
        correctExample: '{ "dv": 1, "fingerprint": "uniq-device-or-container-id" }',
        messageInterpolation: { details: 'Please, check the example for details' },
    },
}

const VerifyPendingPaymentService = new GQLCustomSchema('VerifyPendingPaymentService', {
    types: [
        {
            access: true,
            type: 'input VerifyPendingPaymentInput { dv: Int!, sender: SenderFieldInput!, providerCode: String!, providerReference: String, paymentId: ID, organization: OrganizationWhereUniqueInput, organizationId: ID, context: JSON, paymentMethod: String, confirmedAt: String }',
        },
        {
            access: true,
            type: 'type VerifyPendingPaymentOutput { paymentId: ID, provider: String, providerReference: String, amount: String, currency: String, status: String, authorizationUrl: String, paymentUrl: String, actionTaken: String }',
        },
    ],

    mutations: [
        {
            access: access.canVerifyPendingPayment,
            schema: 'verifyPendingPayment(data: VerifyPendingPaymentInput!): VerifyPendingPaymentOutput',
            resolver: async (parent, args, context) => {
                const { data } = args

                checkDvAndSender(data, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

                return await verifyPendingPaymentPublic(context, data)
            },
        },
    ],
})

module.exports = {
    VerifyPendingPaymentService,
}
