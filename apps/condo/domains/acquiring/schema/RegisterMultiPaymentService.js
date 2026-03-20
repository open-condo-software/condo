const Big = require('big.js')

const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/acquiring/access/RegisterMultiPaymentService')
const {
    FEE_CALCULATION_PATH,
    WEB_VIEW_PATH,
    DIRECT_PAYMENT_PATH,
    GET_CARD_TOKENS_PATH,
} = require('@condo/domains/acquiring/constants/links')
const {
    DEFAULT_MULTIPAYMENT_SERVICE_CATEGORY,
} = require('@condo/domains/acquiring/constants/payment')
const { Payment, MultiPayment } = require('@condo/domains/acquiring/utils/serverSchema')
const { fetchInitialEntities } = require('@condo/domains/acquiring/utils/serverSchema/registerMultiPayment/loader')
const { fetchRelatedEntitiesAndProcessReceipts, fetchRelatedEntitiesAndProcessInvoices, calculateTotalAmount } = require('@condo/domains/acquiring/utils/serverSchema/registerMultiPayment/processor')
const { validateInput, validateInitialEntitiesState, validateLimits } = require('@condo/domains/acquiring/utils/serverSchema/registerMultiPayment/validation')
const {
    DEFAULT_INVOICE_CURRENCY_CODE,
} = require('@condo/domains/marketplace/constants')

const RegisterMultiPaymentService = new GQLCustomSchema('RegisterMultiPaymentService', {
    types: [
        {
            access: true,
            type: 'input RegisterMultiPaymentReceiptAmountInput { receipt: BillingReceiptWhereUniqueInput!, amount: String! }',
        },
        {
            access: true,
            type: 'input RegisterMultiPaymentServiceConsumerInput { serviceConsumer: ServiceConsumerWhereUniqueInput!, receipts: [BillingReceiptWhereUniqueInput!]!, amountDistribution: [RegisterMultiPaymentReceiptAmountInput!] }',
        },
        {
            access: true,
            type: 'input RegisterMultiPaymentInput { dv: Int!, sender: SenderFieldInput!, groupedReceipts: [RegisterMultiPaymentServiceConsumerInput!], recurrentPaymentContext: RecurrentPaymentContextWhereUniqueInput, invoices: [InvoiceWhereUniqueInput!] }',
        },
        {
            access: true,
            type: 'type RegisterMultiPaymentOutput { dv: Int!, multiPaymentId: String!, webViewUrl: String!, feeCalculationUrl: String!, directPaymentUrl: String!, getCardTokensUrl: String! }',
        },
    ],

    mutations: [
        {
            access: access.canRegisterMultiPayment,
            schema: 'registerMultiPayment(data: RegisterMultiPaymentInput!): RegisterMultiPaymentOutput',
            resolver: async (parent, args, context) => {
                const { data } = args
                const {
                    sender,
                    recurrentPaymentContext,
                } = data

                // Stage 0. Check if input is valid
                console.log('[DEBUG] RegisterMultiPaymentService: validateInput start', { data })
                validateInput(data, context)

                // Stage 1. Load basic data (Consumers or Invoices)
                console.log('[DEBUG] RegisterMultiPaymentService: basic data loading start')
                const {
                    consumers,
                    foundInvoices,
                    recurrentContext,
                } = await fetchInitialEntities(data, context)

                // Stage 2. Validate basic state
                validateInitialEntitiesState({
                    data,
                    consumers,
                    foundInvoices,
                    recurrentContext,
                }, context)

                // Stage 3. Process and Generate payments (with lazy loading of related entities)
                console.log('[DEBUG] RegisterMultiPaymentService: process start')
                let paymentCreateInputs = []
                let acquiringIntegration = null
                let billingIntegrations = []

                if (foundInvoices.length > 0) {
                    const result = await fetchRelatedEntitiesAndProcessInvoices({ data, context, foundInvoices })
                    paymentCreateInputs = result.paymentCreateInputs
                    acquiringIntegration = result.acquiringIntegration
                } else {
                    const result = await fetchRelatedEntitiesAndProcessReceipts({ data, context, consumers })
                    paymentCreateInputs = result.paymentCreateInputs
                    acquiringIntegration = result.acquiringIntegration
                    billingIntegrations = result.billingIntegrations
                }

                const totalAmount = calculateTotalAmount(paymentCreateInputs)
                const amountToPay = Big(totalAmount.amountWithoutExplicitFee)
                    .add(Big(totalAmount.explicitServiceCharge))
                    .add(Big(totalAmount.explicitFee))

                validateLimits(acquiringIntegration, amountToPay, context)

                console.log('[DEBUG] RegisterMultiPaymentService: creating records', {
                    paymentCreateInputs: paymentCreateInputs.length,
                    totalAmount: amountToPay.toFixed(2),
                })

                // Stage 4. Create records
                const payments = await Promise.all(paymentCreateInputs.map((paymentInput) => Payment.create(context, paymentInput)))

                const currencyCode = billingIntegrations[0]?.currencyCode || DEFAULT_INVOICE_CURRENCY_CODE

                const paymentIds = payments.map(payment => ({ id: payment.id }))
                const recurrentPaymentContextField = recurrentPaymentContext ? {
                    recurrentPaymentContext: { connect: { id: recurrentPaymentContext.id } },
                } : {}

                const multiPayment = await MultiPayment.create(context, {
                    dv: 1,
                    sender,
                    ...Object.fromEntries(Object.entries(totalAmount).map(([key, value]) => ([key, value.toFixed(2)]))),
                    currencyCode,
                    user: { connect: { id: context.authedItem.id } },
                    integration: { connect: { id: acquiringIntegration.id } },
                    payments: { connect: paymentIds },
                    serviceCategory: DEFAULT_MULTIPAYMENT_SERVICE_CATEGORY,
                    ...recurrentPaymentContextField,
                })

                console.log('[DEBUG] RegisterMultiPaymentService: multiPayment created', { id: multiPayment.id })

                return {
                    dv: 1,
                    multiPaymentId: multiPayment.id,
                    webViewUrl: `${acquiringIntegration.hostUrl}${WEB_VIEW_PATH.replace('[id]', multiPayment.id)}`,
                    feeCalculationUrl: `${acquiringIntegration.hostUrl}${FEE_CALCULATION_PATH.replace('[id]', multiPayment.id)}`,
                    directPaymentUrl: `${acquiringIntegration.hostUrl}${DIRECT_PAYMENT_PATH.replace('[id]', multiPayment.id)}`,
                    getCardTokensUrl: `${acquiringIntegration.hostUrl}${GET_CARD_TOKENS_PATH.replace('[id]', context.authedItem.id)}`,
                }
            },
        },
    ],
})

module.exports = {
    RegisterMultiPaymentService,
}

