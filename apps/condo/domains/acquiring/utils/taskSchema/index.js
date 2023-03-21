const Big = require('big.js')
const dayjs = require('dayjs')
const { get, isNil, isUndefined } = require('lodash')

const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')

const {
    PAYMENT_DONE_STATUS,
    PAYMENT_WITHDRAWN_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    RECURRENT_PAYMENT_INIT_STATUS,
    RECURRENT_PAYMENT_DONE_STATUS,
    RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS,
    RECURRENT_PAYMENT_ERROR_STATUS,
    RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_SERVICE_CONSUMER_NOT_FOUND_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    RecurrentPayment,
    RecurrentPaymentContext,
    Payment,
    registerMultiPayment: registerMultiPaymentMutation,
    MultiPayment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    BillingReceipt,
} = require('@condo/domains/billing/utils/serverSchema')
const {
    RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_FAILURE_RESULT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const {
    ServiceConsumer,
} = require('@condo/domains/resident/utils/serverSchema')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'recurrent-payment-queries' } }
const logger = getLogger('recurrent-payment-processing-queries')

async function getAllReadyToPayRecurrentPaymentContexts (context, date, pageSize, offset, extraArgs = {}) {
    if (isNil(date)) throw new Error('invalid date argument')
    if (isNil(pageSize) || pageSize < 0) throw new Error('invalid pageSize argument')
    if (isNil(offset) || offset < 0) throw new Error('invalid offset argument')

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
            deletedAt: null,
            ...paymentDayCondition,
            ...extraArgs,
        }, {
            sortBy: 'id_ASC',
            first: pageSize,
            skip: offset,
        }
    )
}

async function getServiceConsumer (context, id) {
    if (isNil(id)) throw new Error('invalid id argument')

    const consumer = await ServiceConsumer.getOne(context, {
        id,
        deletedAt: null,
    }, {
        doesNotExistError: {
            code: BAD_USER_INPUT,
            type: RECURRENT_PAYMENT_PROCESS_ERROR_SERVICE_CONSUMER_NOT_FOUND_CODE,
            message: `ServiceConsumer not found for id ${id}`,
        },
    })

    return consumer
}

async function getReceiptsForServiceConsumer (context, date, serviceConsumer, billingCategory, extraArgs = {}) {
    if (isNil(date)) throw new Error('invalid date argument')
    if (isNil(serviceConsumer) || isNil(get(serviceConsumer, 'id')))
        throw new Error('invalid serviceConsumer argument')

    const periodDate = dayjs(date)
    const period = periodDate.format('YYYY-MM-01')

    // select all ids
    const billingCategoryId = get(billingCategory, 'id')
    const {
        accountNumber: billingAccountNumber,
        organization: { id: organizationId },
    } = await getServiceConsumer(context, serviceConsumer.id)

    // validate them
    if (!billingAccountNumber) {
        throw Error(`Can not retrieve billing receipts for service consumer ${serviceConsumer.id} since billingAccountNumber is empty`)
    }

    // prepare conditions
    const billingCategoryCondition = billingCategoryId ? { category: { id: billingCategoryId } } : {}
    const billingAccountCondition = { account: { number: billingAccountNumber } }
    const billingIntegrationContextCondition = { context: { organization: { id: organizationId } } }
    const periodCondition = { period_in: [period] }

    // select data
    return await BillingReceipt.getAll(context, {
        ...billingCategoryCondition,
        ...billingAccountCondition,
        ...billingIntegrationContextCondition,
        ...periodCondition,
        ...extraArgs,
    })
}

async function filterPaidBillingReceipts (context, billingReceipts) {
    if (isNil(billingReceipts)) throw new Error('invalid billingReceipts argument')

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

async function getReadyForProcessingPaymentsPage (context, pageSize, offset, extraArgs) {
    if (isNil(pageSize) || pageSize < 0) throw new Error('invalid pageSize argument')
    if (isNil(offset) || offset < 0) throw new Error('invalid offset argument')

    return await RecurrentPayment.getAll(context, {
        OR: [ { payAfter: null }, { payAfter_lte: dayjs().toISOString() }],
        tryCount_lt: 5,
        status_in: [RECURRENT_PAYMENT_INIT_STATUS, RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS],
        ...extraArgs,
    }, {
        sortBy: 'id_ASC',
        first: pageSize,
        skip: offset,
    })
}

async function registerMultiPayment (context, recurrentPayment) {
    if (isNil(recurrentPayment)
        || isNil(get(recurrentPayment, 'id'))
        || isNil(get(recurrentPayment, 'billingReceipts'))
        || isNil(get(recurrentPayment, 'recurrentPaymentContext.id')))
        throw new Error('invalid recurrentPayment argument')

    const {
        id,
        billingReceipts,
        recurrentPaymentContext: {
            id: recurrentPaymentContextId,
        },
    } = recurrentPayment

    // retrieve context
    const recurrentContext = await RecurrentPaymentContext.getOne(context, {
        id: recurrentPaymentContextId,
        deletedAt: null,
    })

    // validate context
    if (!recurrentContext) {
        return {
            registered: false,
            errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE,
            errorMessage: `RecurrentPaymentContext not found for RecurrentPayment(${id})`,
        }
    } else if (!recurrentContext.enabled) {
        return {
            registered: false,
            errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE,
            errorMessage: `RecurrentPaymentContext (${recurrentContext.id}) is disabled`,
        }
    }

    // filter billing receipts, since some of them can be already paid
    const notPaidReceipts = await filterPaidBillingReceipts(context, billingReceipts)

    // no bills to pay case
    if (notPaidReceipts.length === 0) {
        return { registered:false }
    }

    // get user context for registering multi payment
    const { resident: { user } } = await getServiceConsumer(context, recurrentContext.serviceConsumer.id)
    const userContext = await context.createContext({
        authentication: {
            item: user,
            listKey: 'User',
        },
    })

    // create multi payment
    const registerRequest = {
        ...dvAndSender,
        groupedReceipts: [{
            serviceConsumer: { id: recurrentContext.serviceConsumer.id },
            receipts: notPaidReceipts.map(receipt => ({ id: receipt.id })),
        }],
        recurrentPaymentContext: { id: recurrentContext.id },
    }

    // do register
    let registerResponse = null
    let registerError = null
    try {
        registerResponse = await registerMultiPaymentMutation(userContext, registerRequest)
    } catch (e) {
        registerError = get(e, 'errors[0].message') || get(e, 'message')
    }

    // failed to register multi payment
    if (!registerResponse || !registerResponse.multiPaymentId) {
        return {
            registered:false,
            errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE,
            errorMessage: `Can not register multi payment: ${registerError}`,
        }
    }

    // get multi payment
    const multiPayment = await MultiPayment.getOne(context, {
        id: registerResponse.multiPaymentId,
    })

    // check limits for recurrent context
    // in case if limit is set up
    if (recurrentContext.limit && Big(multiPayment.amount).gt(Big(recurrentContext.limit))) {
        return {
            registered: false,
            errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE,
            errorMessage: `RecurrentPaymentContext limit exceeded for multi payment ${multiPayment.id}`,
        }
    }

    return {
        registered: true,
        ...registerResponse,
    }
}

async function sendResultMessageSafely (context, recurrentPayment, success, errorCode) {
    if (isNil(recurrentPayment)
        || isNil(get(recurrentPayment, 'id'))
        || isNil(get(recurrentPayment, 'tryCount'))
        || isNil(get(recurrentPayment, 'recurrentPaymentContext.id')))
        throw new Error('invalid recurrentPayment argument')

    const {
        id,
        tryCount,
        recurrentPaymentContext: { id: recurrentContextId },
    } = recurrentPayment
    const uniqKey = `rp_${id}_${tryCount + 1}_${success}`
    const type = success ? RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE
        : RECURRENT_PAYMENT_PROCEEDING_FAILURE_RESULT_MESSAGE_TYPE
    const meta = success ? {} : { errorCode }

    try {
        const {
            serviceConsumer: { resident: { user: { id: userId } } },
        } = await RecurrentPaymentContext.getOne(context, { id: recurrentContextId })

        await sendMessage(context, {
            ...dvAndSender,
            to: { user: { id: userId } },
            type,
            uniqKey,
            meta: {
                dv: 1,
                recurrentPaymentContext: { id: recurrentContextId },
                ...meta,
            },
        })
    } catch (error) {
        logger.error({ msg: 'sendMessage error', error })
    }
}

async function sendTomorrowPaymentNotificationSafely (context, recurrentPaymentContext, recurrentPayment) {
    if (isNil(recurrentPaymentContext) || isNil(get(recurrentPaymentContext, 'id')))
        throw new Error('invalid recurrentPaymentContext argument')

    if (!isUndefined(recurrentPayment) && isNil(get(recurrentPayment, 'id')))
        throw new Error('invalid recurrentPayment argument')

    try {
        const {
            serviceConsumer: { resident: { user: { id: userId } } },
        } = await RecurrentPaymentContext.getOne(context, { id: recurrentPaymentContext.id })

        // get trigger identifier
        const recurrentPaymentId = get(recurrentPayment, 'id')
        const previousMonthDate = dayjs().startOf('month').subtract(1, 'days')
        const period = previousMonthDate.format('YYYY-MM-01')
        const triggerIdentifier = recurrentPaymentId || period

        // create unique key and send message
        const uniqKey = `rp_tp_${recurrentPaymentContext.id}_${triggerIdentifier}`
        await sendMessage(context, {
            ...dvAndSender,
            to: { user: { id: userId } },
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            uniqKey,
            meta: {
                dv: 1,
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            },
        })
    } catch (error) {
        logger.error({ msg: 'sendMessage error', error })
    }
}

async function setRecurrentPaymentAsSuccess (context, recurrentPayment) {
    if (isNil(recurrentPayment) || isNil(get(recurrentPayment, 'id')) || isNil(get(recurrentPayment, 'tryCount')))
        throw new Error('invalid recurrentPayment argument')
    const {
        id,
        tryCount,
    } = recurrentPayment

    await RecurrentPayment.update(context, id, {
        ...dvAndSender,
        tryCount: tryCount + 1,
        status: RECURRENT_PAYMENT_DONE_STATUS,
    })

    await sendResultMessageSafely(context, recurrentPayment, true)
}

async function setRecurrentPaymentAsFailed (context, recurrentPayment, errorMessage, errorCode = RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE) {
    if (isNil(recurrentPayment) || isNil(get(recurrentPayment, 'id')) || isNil(get(recurrentPayment, 'tryCount')))
        throw new Error('invalid recurrentPayment argument')
    if (isNil(errorMessage)) throw new Error('invalid errorMessage argument')
    if (isNil(errorCode)) throw new Error('invalid errorCode argument')

    const {
        id,
        tryCount,
    } = recurrentPayment

    const nextTryCount = tryCount + 1
    let nextStatus = RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS

    // cases when we have to deny retry
    if (nextTryCount >= 5
        || errorCode === RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE
        || errorCode === RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE
        || errorCode === RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE
        || errorCode === RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE) {
        nextStatus = RECURRENT_PAYMENT_ERROR_STATUS
    }

    // update tryCount/status/state
    await RecurrentPayment.update(context, id, {
        ...dvAndSender,
        tryCount: nextTryCount,
        status: nextStatus,
        state: {
            errorCode,
            errorMessage,
        },
    })

    await sendResultMessageSafely(context, recurrentPayment, false, errorCode)
}

module.exports = {
    getAllReadyToPayRecurrentPaymentContexts,
    getServiceConsumer,
    getReceiptsForServiceConsumer,
    filterPaidBillingReceipts,
    getReadyForProcessingPaymentsPage,
    registerMultiPayment,
    setRecurrentPaymentAsSuccess,
    setRecurrentPaymentAsFailed,
    sendTomorrowPaymentNotificationSafely,
}