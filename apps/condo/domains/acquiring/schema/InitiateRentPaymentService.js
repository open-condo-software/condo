const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/acquiring/access/PublicRentPaymentService')
const { initiateRentPaymentPublic } = require('@condo/domains/acquiring/utils/serverSchema')
const { DV_VERSION_MISMATCH, WRONG_FORMAT } = require('@condo/domains/common/constants/errors')

const ERRORS = {
    DV_VERSION_MISMATCH: {
        mutation: 'initiateRentPayment',
        variable: ['data', 'dv'],
        code: BAD_USER_INPUT,
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
    WRONG_SENDER_FORMAT: {
        mutation: 'initiateRentPayment',
        variable: ['data', 'sender'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid format of "sender" field value. {details}',
        correctExample: '{ "dv": 1, "fingerprint": "uniq-device-or-container-id" }',
        messageInterpolation: { details: 'Please, check the example for details' },
    },
}

const InitiateRentPaymentService = new GQLCustomSchema('InitiateRentPaymentService', {
    types: [
        {
            access: true,
            type: 'input InitiateRentPaymentInput { dv: Int!, sender: SenderFieldInput!, organization: OrganizationWhereUniqueInput!, tenant: ResidentWhereUniqueInput, occupancy: OccupancyWhereUniqueInput, property: PropertyWhereUniqueInput, rentalUnit: RentalUnitWhereUniqueInput, amount: String!, currency: String, currencyCode: String, providerCode: String!, paymentMethod: String, providerReference: String, reference: String, purpose: String, payer: JSON, payerContact: JSON, paymentContext: JSON, rentContext: JSON }',
        },
        {
            access: true,
            type: 'type InitiateRentPaymentOutput { paymentId: ID, provider: String, providerReference: String, amount: String, currency: String, status: String, authorizationUrl: String, paymentUrl: String, actionTaken: String }',
        },
    ],

    mutations: [
        {
            access: access.canInitiateRentPayment,
            schema: 'initiateRentPayment(data: InitiateRentPaymentInput!): InitiateRentPaymentOutput',
            resolver: async (parent, args, context) => {
                const { data } = args

                checkDvAndSender(data, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

                return await initiateRentPaymentPublic(context, data)
            },
        },
    ],
})

module.exports = {
    InitiateRentPaymentService,
}
