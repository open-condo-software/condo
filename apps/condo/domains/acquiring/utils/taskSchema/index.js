const Big = require('big.js')
const dayjs = require('dayjs')
const { get, isNil, isUndefined } = require('lodash')

const conf = require('@open-condo/config')
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
    RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_SERVICE_CONSUMER_NOT_FOUND_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_NO_RECEIPTS_TO_PROCEED_CODE,
    INSURANCE_BILLING_CATEGORY,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    RecurrentPayment,
    RecurrentPaymentContext,
    Payment,
    registerMultiPayment: registerMultiPaymentMutation,
    MultiPayment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const { getAcquiringIntegrationContextFormula, FeeDistribution } = require('@condo/domains/acquiring/utils/serverSchema/feeDistribution')
const {
    BillingReceipt,
} = require('@condo/domains/billing/utils/serverSchema')
const {
    RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_UNKNOWN_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_ACQUIRING_PAYMENT_PROCEED_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_SERVICE_CONSUMER_NOT_FOUND_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_LIMIT_EXCEEDED_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_CONTEXT_NOT_FOUND_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_CONTEXT_DISABLED_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_CARD_TOKEN_NOT_VALID_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_CAN_NOT_REGISTER_MULTI_PAYMENT_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_NO_RECEIPTS_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { SERVICE_CONSUMER_FIELDS } = require('@condo/domains/resident/gql')
const {
    ServiceConsumer,
} = require('@condo/domains/resident/utils/serverSchema')

const RETRY_COUNT = 5

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'recurrent-payment-queries' } }
const logger = getLogger()

function getNotificationMetaByErrorCode (errorCode, recurrentPaymentContextId) {
    const errorCodeNotificationTypes = {
        [RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_UNKNOWN_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/support/create/`,
        },
        [RECURRENT_PAYMENT_PROCESS_ERROR_SERVICE_CONSUMER_NOT_FOUND_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_SERVICE_CONSUMER_NOT_FOUND_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/support/create/`,
        },
        [RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_LIMIT_EXCEEDED_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContextId}/`,
        },
        [RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_CONTEXT_NOT_FOUND_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/support/create/`,
            doNotSendNotification: true,
        },
        [RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_CONTEXT_DISABLED_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/support/create/`,
        },
        [RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_CARD_TOKEN_NOT_VALID_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContextId}/`,
        },
        [RECURRENT_PAYMENT_PROCESS_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_CAN_NOT_REGISTER_MULTI_PAYMENT_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/support/create/`,
        },
        [RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_ACQUIRING_PAYMENT_PROCEED_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/payments/`,
        },
        [RECURRENT_PAYMENT_PROCESS_ERROR_NO_RECEIPTS_TO_PROCEED_CODE]: {
            type: RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
            url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContextId}`,
        },
    }

    return errorCodeNotificationTypes[errorCode]
        || errorCodeNotificationTypes[RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE]
}

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
    const autoPayReceipts = get(extraArgs, 'autoPayReceipts')
    const triggerCondition = autoPayReceipts ? {
        paymentDay: null,
        autoPayReceipts: true,
    } : { ...paymentDayCondition, autoPayReceipts: false }

    return await RecurrentPaymentContext.getAll(
        context, {
            enabled: true,
            deletedAt: null,
            ...triggerCondition,
            ...extraArgs,
        },
        'id serviceConsumer { id } billingCategory { id } enabled paymentDay autoPayReceipts',
        { sortBy: 'id_ASC', first: pageSize, skip: offset }
    )
}

async function getServiceConsumer (context, id) {
    if (isNil(id)) throw new Error('invalid id argument')

    const consumer = await ServiceConsumer.getOne(context, {
        id,
        deletedAt: null,
    },
    SERVICE_CONSUMER_FIELDS,
    {
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
    const monthBeforePeriod = periodDate.startOf('month').subtract(1, 'month').format('YYYY-MM-01')
    const twoMonthBeforePeriod = periodDate.startOf('month').subtract(2, 'month').format('YYYY-MM-01')

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
    // TODO DOMA-11572
    const billingCategoryCondition = billingCategoryId ? { category: { id: billingCategoryId } } : { category: { id_not: INSURANCE_BILLING_CATEGORY } }
    const billingAccountCondition = { account: { number: billingAccountNumber } }
    const billingIntegrationContextCondition = { context: { organization: { id: organizationId } } }
    const periodCondition = { period_in: [period, monthBeforePeriod, twoMonthBeforePeriod] }

    // select data
    const receipts = await BillingReceipt.getAll(context, {
        ...billingCategoryCondition,
        ...billingAccountCondition,
        ...billingIntegrationContextCondition,
        ...periodCondition,
        ...extraArgs,
        deletedAt: null,
    }, 'id period toPay account { id number } receiver { id } category { id } ')

    // let's create a map for receipt concatenated identifiers -> receipt
    // in order to deduplicate same receipts for different periods
    const receiptsByAccountAndRecipient = {}
    for (const receipt of receipts) {
        const accountNumber = get(receipt, ['account', 'number'])
        const recipientId = get(receipt, ['receiver', 'id'])
        const categoryId = get(receipt, ['category', 'id'])
        const key = accountNumber + '-' + recipientId + '-' + categoryId

        const period = dayjs(get(receipt, ['period']), 'YYYY-MM-DD')

        if (!(key in receiptsByAccountAndRecipient)) {
            receiptsByAccountAndRecipient[key] = receipt
            continue
        }

        // If we have a receipt with later period -- we take it
        const existingRecipientPeriod = dayjs(get(receiptsByAccountAndRecipient[key], 'period'), 'YYYY-MM-DD')
        if (existingRecipientPeriod < period) {
            receiptsByAccountAndRecipient[key] = receipt
        }
    }

    // get map values
    return Object.values(receiptsByAccountAndRecipient)
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
    }, 'id receipt { id }')

    // map to receipt ids
    const payedBillIds = payments.map(payment => payment.receipt.id)

    const notPaidBillsIds = billingReceipts.filter(receipt => {
        const { id } = receipt

        return !payedBillIds.includes(id)
    }).map(receipt => receipt.id)

    return await BillingReceipt.getAll(context, {
        id_in: notPaidBillsIds,
        toPay_gt: '0',
        deletedAt: null,
    }, 'id toPay category { id }')
}

async function isLimitExceedForBillingReceipts (context, recurrentPaymentContext, billingReceipts) {
    if (isNil(recurrentPaymentContext) || isNil(get(recurrentPaymentContext, 'id')) || isNil(get(recurrentPaymentContext, 'serviceConsumer.id'))) throw new Error('invalid recurrentPaymentContext argument')
    if (isNil(billingReceipts)) throw new Error('invalid billingReceipts argument')

    // no limit case: limit can not be exceeded since it is omitted
    if (!recurrentPaymentContext.limit) {
        return { isExceed: false }
    }

    // get fee distribution formula
    const serviceConsumer = await getServiceConsumer(context, recurrentPaymentContext.serviceConsumer.id)
    const formula = await getAcquiringIntegrationContextFormula(context, serviceConsumer.residentAcquiringIntegrationContext.id)

    // calc final amount for each billing receipt and accumulate it to total
    let totalAmount = Big(0)
    billingReceipts.forEach(receipt => {
        const billingCategoryId = get(receipt, 'category.id')
        const feeCalculator = new FeeDistribution(formula, billingCategoryId)
        const { summa } = feeCalculator.calculate(Big(receipt.toPay))
        totalAmount = totalAmount.plus(summa)
    })

    return {
        isExceed: totalAmount.gt(Big(recurrentPaymentContext.limit)),
        totalAmount: totalAmount,
    }
}

async function getReadyForProcessingPaymentsPage (context, pageSize, offset, extraArgs) {
    if (isNil(pageSize) || pageSize < 0) throw new Error('invalid pageSize argument')
    if (isNil(offset) || offset < 0) throw new Error('invalid offset argument')

    return await RecurrentPayment.getAll(context, {
        OR: [ { payAfter: null }, { payAfter_lte: dayjs().toISOString() }],
        tryCount_lt: RETRY_COUNT,
        createdAt_gte: dayjs().add(-7, 'day').toISOString(), // just to not get paginated over older payments
        deletedAt: null,
        ...extraArgs,
    },
    'id status tryCount billingReceipts { id } recurrentPaymentContext { id }',
    { sortBy: 'id_ASC', first: pageSize, skip: offset },
    )
}

async function filterNotPayablePayment (recurrentPayments) {
    return recurrentPayments
        .filter(item => item.status === RECURRENT_PAYMENT_INIT_STATUS || item.status === RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS)
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
    }, 'id enabled serviceConsumer { id } limit')

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
    let userContext = null
    try {
        const { resident: { user } } = await getServiceConsumer(context, recurrentContext.serviceConsumer.id)
        userContext = await context.createContext({
            authentication: {
                item: user,
                listKey: 'User',
            },
        })
    } catch (e) {
        // can not retrieve service consumer case
        const errorCode = get(e, 'extensions.type') || RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE
        const errorMessage = get(e, 'extensions.message') || get(e, 'message')

        // can not register multi payment for deleted service consumer
        return {
            registered: false,
            errorCode,
            errorMessage,
        }
    }

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
    }, 'id amount')

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
    const currentTryCount = tryCount + 1
    const uniqKey = `rp_${id}_${currentTryCount}_${success}`
    const failedMessageMeta = getNotificationMetaByErrorCode(errorCode, recurrentContextId)
    const type = success ? RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE
        : failedMessageMeta.type
    const url = success ? `${conf.SERVER_URL}/payments/` : failedMessageMeta.url
    const additionalData = success ? {} : { errorCode, lastTry: currentTryCount >= RETRY_COUNT }

    // in case if error happens
    // and error meta signals to us - do not send notification to end user
    if (!success && get(failedMessageMeta, 'doNotSendNotification')) {
        return
    }

    try {
        const {
            serviceConsumer: {
                id: serviceConsumerId,
                resident: { id: residentId, user: { id: userId } },
            },
        } = await RecurrentPaymentContext.getOne(context, { id: recurrentContextId },
            'serviceConsumer { id resident { id user { id } } }',
        )

        // TODO(DOMA-11040): get locale for sendMessage from user
        await sendMessage(context, {
            ...dvAndSender,
            to: { user: { id: userId } },
            type,
            uniqKey,
            meta: {
                dv: 1,
                data: {
                    recurrentPaymentContextId: recurrentContextId,
                    recurrentPaymentId: id,
                    serviceConsumerId,
                    residentId,
                    userId,
                    url,
                    ...additionalData,
                },
            },
        })
    } catch (err) {
        logger.error({ msg: 'sendMessage error', err })
    }
}

async function sendTomorrowPaymentNotificationSafely (context, recurrentPaymentContext, recurrentPayment) {
    if (isNil(recurrentPaymentContext) || isNil(get(recurrentPaymentContext, 'id'))) throw new Error('invalid recurrentPaymentContext argument')
    if (!isUndefined(recurrentPayment) && isNil(get(recurrentPayment, 'id'))) throw new Error('invalid recurrentPayment argument')

    try {
        const {
            serviceConsumer: {
                id: serviceConsumerId,
                resident: { id: residentId, user: { id: userId } },
            },
        } = await RecurrentPaymentContext.getOne(context, { id: recurrentPaymentContext.id },
            'serviceConsumer { id resident { id user { id } } }',
        )

        // get trigger identifier
        const recurrentPaymentId = get(recurrentPayment, 'id')
        const triggerIdentifier = recurrentPaymentId || dayjs().format('YYYY-MM-DD')

        // create unique key and send message
        const uniqKey = `rp_tp_${recurrentPaymentContext.id}_${triggerIdentifier}`
        // TODO(DOMA-11040): get locale for sendMessage from user
        await sendMessage(context, {
            ...dvAndSender,
            to: { user: { id: userId } },
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            uniqKey,
            meta: {
                dv: 1,
                data: {
                    recurrentPaymentContextId: recurrentPaymentContext.id,
                    serviceConsumerId,
                    residentId,
                    userId,
                    url: `${conf.SERVER_URL}/payments/`,
                },
            },
        })
    } catch (err) {
        logger.error({ msg: 'sendMessage error', err })
    }
}

async function sendTomorrowPaymentNoReceiptsNotificationSafely (context, recurrentPaymentContext) {
    if (isNil(recurrentPaymentContext) || isNil(get(recurrentPaymentContext, 'id'))) throw new Error('invalid recurrentPaymentContext argument')

    try {
        const {
            serviceConsumer: {
                id: serviceConsumerId,
                resident: { id: residentId, user: { id: userId } },
            },
        } = await RecurrentPaymentContext.getOne(context, { id: recurrentPaymentContext.id },
            'serviceConsumer { id resident { id user { id } } }',
        )

        // create unique key and send message
        const uniqKey = `rp_tpnr_${recurrentPaymentContext.id}_${dayjs().format('YYYY-MM-DD')}`
        // TODO(DOMA-11040): get locale for sendMessage from user
        await sendMessage(context, {
            ...dvAndSender,
            to: { user: { id: userId } },
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_NO_RECEIPTS_MESSAGE_TYPE,
            uniqKey,
            meta: {
                dv: 1,
                data: {
                    recurrentPaymentContextId: recurrentPaymentContext.id,
                    serviceConsumerId,
                    residentId,
                    userId,
                    url: `${conf.SERVER_URL}/payments/`,
                },
            },
        })
    } catch (err) {
        logger.error({ msg: 'sendMessage error', err })
    }
}

async function sendTomorrowPaymentLimitExceedNotificationSafely (context, recurrentPaymentContext, toPayAmount) {
    if (isNil(recurrentPaymentContext) || isNil(get(recurrentPaymentContext, 'id'))) throw new Error('invalid recurrentPaymentContext argument')
    if (isNil(toPayAmount)) throw new Error('invalid toPayAmount argument')

    try {
        const {
            serviceConsumer: {
                id: serviceConsumerId,
                resident: { id: residentId, user: { id: userId } },
            },
        } = await RecurrentPaymentContext.getOne(context, { id: recurrentPaymentContext.id },
            'serviceConsumer { id resident { id user { id } } }',
        )

        // create unique key and send message
        const uniqKey = `rp_tple_${recurrentPaymentContext.id}_${dayjs().format('YYYY-MM-DD')}`
        // TODO(DOMA-11040): get locale for sendMessage from user
        await sendMessage(context, {
            ...dvAndSender,
            to: { user: { id: userId } },
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
            uniqKey,
            meta: {
                dv: 1,
                data: {
                    recurrentPaymentContextId: recurrentPaymentContext.id,
                    serviceConsumerId,
                    residentId,
                    userId,
                    url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}/`,
                    toPayAmount: String(toPayAmount),
                },
            },
        })
    } catch (err) {
        logger.error({ msg: 'sendMessage error', err })
    }
}

async function sendNoReceiptsToProceedNotificationSafely (context, recurrentPaymentContext) {
    if (isNil(recurrentPaymentContext) || isNil(get(recurrentPaymentContext, 'id'))) throw new Error('invalid recurrentPaymentContext argument')

    try {
        const {
            serviceConsumer: {
                id: serviceConsumerId,
                resident: { id: residentId, user: { id: userId } },
            },
        } = await RecurrentPaymentContext.getOne(context, { id: recurrentPaymentContext.id },
            'serviceConsumer { id resident { id user { id } } }',
        )

        // create unique key and send message
        const uniqKey = `rp_nrtp_${recurrentPaymentContext.id}_${dayjs().format('YYYY-MM-DD')}`
        // TODO(DOMA-11040): get locale for sendMessage from user
        await sendMessage(context, {
            ...dvAndSender,
            to: { user: { id: userId } },
            type: RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
            uniqKey,
            meta: {
                dv: 1,
                data: {
                    recurrentPaymentContextId: recurrentPaymentContext.id,
                    serviceConsumerId,
                    residentId,
                    userId,
                    url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}`,
                },
            },
        })
    } catch (err) {
        logger.error({ msg: 'sendMessage error', err })
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
    if (nextTryCount >= RETRY_COUNT
        || errorCode === RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE
        || errorCode === RECURRENT_PAYMENT_PROCESS_ERROR_NO_RECEIPTS_TO_PROCEED_CODE) {
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
    filterNotPayablePayment,
    registerMultiPayment,
    setRecurrentPaymentAsSuccess,
    setRecurrentPaymentAsFailed,
    sendTomorrowPaymentNotificationSafely,
    sendTomorrowPaymentNoReceiptsNotificationSafely,
    sendNoReceiptsToProceedNotificationSafely,
    sendTomorrowPaymentLimitExceedNotificationSafely,
    getNotificationMetaByErrorCode,
    isLimitExceedForBillingReceipts,
    RETRY_COUNT,
}
