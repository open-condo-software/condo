const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/acquiring/access/RecordManualRentPaymentService')
const { reverseManualRentPayment } = require('@condo/domains/acquiring/utils/serverSchema')
const { DV_VERSION_MISMATCH, REQUIRED, WRONG_FORMAT } = require('@condo/domains/common/constants/errors')

const ERRORS = {
    DV_VERSION_MISMATCH: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'dv'],
        code: BAD_USER_INPUT,
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
    WRONG_SENDER_FORMAT: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'sender'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid format of "sender" field value. {details}',
        correctExample: '{ "dv": 1, "fingerprint": "uniq-device-or-container-id" }',
        messageInterpolation: { details: 'Please, check the example for details' },
    },
    REQUIRED_PAYMENT: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'payment'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'Payment is required for manual rent payment reversal',
    },
    REQUIRED_REASON: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'reason'],
        code: BAD_USER_INPUT,
        type: REQUIRED,
        message: 'Reason is required for manual rent payment reversal',
    },
    PAYMENT_NOT_FOUND: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'payment'],
        code: BAD_USER_INPUT,
        type: 'PAYMENT_NOT_FOUND',
        message: 'Manual rent payment not found',
    },
    ORGANIZATION_MISMATCH: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'organization'],
        code: BAD_USER_INPUT,
        type: 'PAYMENT_ORGANIZATION_MISMATCH',
        message: 'Manual rent payment organization mismatch',
    },
    NOT_MANUAL_PROVIDER: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'payment'],
        code: BAD_USER_INPUT,
        type: 'PAYMENT_NOT_MANUAL_PROVIDER',
        message: 'Only manual rent payments can be reversed',
    },
    NOT_TENANT_PAYMENT: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'payment'],
        code: BAD_USER_INPUT,
        type: 'PAYMENT_NOT_TENANT_SCOPED',
        message: 'Only tenant-scoped rent payments can be reversed',
    },
    ALREADY_REVERSED: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'payment'],
        code: BAD_USER_INPUT,
        type: 'PAYMENT_ALREADY_REVERSED',
        message: 'Manual rent payment is already reversed',
    },
    NOT_CONFIRMED: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'payment'],
        code: BAD_USER_INPUT,
        type: 'PAYMENT_NOT_CONFIRMED',
        message: 'Only confirmed manual rent payments can be reversed',
    },
    LEDGER_INCONSISTENT: {
        mutation: 'reverseManualRentPayment',
        variable: ['data', 'payment'],
        code: BAD_USER_INPUT,
        type: 'PAYMENT_LEDGER_INCONSISTENT',
        message: 'Manual rent payment must have exactly one posted payment ledger entry',
    },
}

const ReverseManualRentPaymentService = new GQLCustomSchema('ReverseManualRentPaymentService', {
    types: [
        {
            access: true,
            type: 'input ReverseManualRentPaymentInput { dv: Int!, sender: SenderFieldInput!, organization: OrganizationWhereUniqueInput!, payment: PaymentWhereUniqueInput!, reason: String! }',
        },
        {
            access: true,
            type: 'type ReverseManualRentPaymentOutput { payment: Payment!, ledgerEntry: LedgerEntry!, allocations: [PaymentAllocation!]!, rentCharges: [RentCharge!]!, ledgerBalance: String! }',
        },
    ],

    mutations: [
        {
            access: access.canReverseManualRentPayment,
            schema: 'reverseManualRentPayment(data: ReverseManualRentPaymentInput!): ReverseManualRentPaymentOutput',
            resolver: async (parent, args, context) => {
                const { data } = args

                checkDvAndSender(data, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

                if (!data.payment || !data.payment.id) {
                    throw new GQLError(ERRORS.REQUIRED_PAYMENT, context)
                }

                if (!String(data.reason || '').trim()) {
                    throw new GQLError(ERRORS.REQUIRED_REASON, context)
                }

                return await reverseManualRentPayment(context, data)
            },
        },
    ],
})

module.exports = {
    ReverseManualRentPaymentService,
}
