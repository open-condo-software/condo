const { getItems } = require('@keystonejs/server-side-graphql-client')
const dayjs = require('dayjs')
const { isNil, get } = require('lodash')

const {
    PAYMENT_DONE_STATUS,
    PAYMENT_WITHDRAWN_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    RecurrentPaymentContext,
    Payment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    BillingReceipt,
} = require('@condo/domains/billing/utils/serverSchema')

async function getReadyForProcessingContextPage (context, date, pageSize, offset) {
    // calculate payment day
    const paymentDay = dayjs(date).date()
    const endOfMonthPaymentDay = dayjs(date).endOf('month').date()

    // proceed conditions
    const paymentDayCondition = paymentDay !== endOfMonthPaymentDay
        ? { paymentDay }
        : { paymentDay_gte: paymentDay }

    return await RecurrentPaymentContext.getAll(
        context, {
            enabled: true,
            autoPayReceipts: false,
            ...paymentDayCondition,
        }, {
            sortBy: 'id_ASC',
            first: pageSize,
            skip: offset,
        }
    )
}

async function getServiceConsumer (context, id) {
    const consumers = await getItems({
        context,
        listKey: 'ServiceConsumer',
        where: {
            id,
        },
        returnFields: 'id accountNumber billingIntegrationContext { id } deletedAt',
    })

    if (consumers.length === 0) {
        throw Error(`ServiceConsumer not found for id ${id}`)
    }
    const [consumer] = consumers

    if (consumer.deletedAt) {
        throw Error(`Found deleted serviceConsumer for id ${id}`)
    }

    return consumer
}

async function getReceiptsForServiceConsumer (context, date, { id: serviceConsumerId }, billingCategory) {
    const periodDate = dayjs(date)
    const period = periodDate.format('YYYY-MM-01')
    const serviceConsumer = await getServiceConsumer(context, serviceConsumerId)

    // select all ids
    const billingCategoryId = get(billingCategory, 'id')
    const billingAccountNumber = get(serviceConsumer, 'accountNumber')
    const billingIntegrationContextId = get(serviceConsumer, 'billingIntegrationContext.id')

    // validate them
    if (isNil(billingIntegrationContextId)) {
        throw Error(`Can not retrieve billing receipts for service consumer ${serviceConsumerId} since billingIntegrationContextId is empty`)
    }
    if (!billingAccountNumber) {
        throw Error(`Can not retrieve billing receipts for service consumer ${serviceConsumerId} since billingAccountNumber is empty`)
    }

    // prepare conditions
    const billingCategoryCondition = billingCategoryId ? { category: { id: billingCategoryId } } : {}
    const billingAccountCondition = { account: { number: billingAccountNumber } }
    const billingIntegrationContextCondition = { context: { id: billingIntegrationContextId } }
    const periodCondition = { period }

    // select data
    return await BillingReceipt.getAll(context, {
        ...billingCategoryCondition,
        ...billingAccountCondition,
        ...billingIntegrationContextCondition,
        ...periodCondition,
    })
}

async function filterPayedBillingReceipts (context, billingReceipts) {
    if (billingReceipts.length === 0) {
        return billingReceipts
    }

    // request payments that have specific statuses and receipts id in a list
    const payments = await Payment.getAll(context, {
        receipt: {
            id_in: billingReceipts.map(receipt => receipt.id),
        },
        status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
    })

    // map to receipt ids
    const payedBillIds = payments.map(payment => payment.receipt.id)

    return billingReceipts.filter(receipt => {
        const { id } = receipt

        return !payedBillIds.includes(id)
    })
}

module.exports = {
    getReadyForProcessingContextPage,
    getServiceConsumer,
    getReceiptsForServiceConsumer,
    filterPayedBillingReceipts,
}