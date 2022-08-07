const { ServiceSubscription, ServiceSubscriptionPayment } = require('@condo/domains/subscription/utils/serverSchema')
const { getSchemaCtx } = require('@condo/keystone/schema')
const dayjs = require('dayjs')
const { initSbbolFintechApi } = require('../SbbolFintechApi')
const { SBBOL_YEARLY_SUBSCRIPTION_PRICE, SUBSCRIPTION_TYPE, SUBSCRIPTION_PAYMENT_STATUS, SUBSCRIPTION_PAYMENT_CURRENCY } = require('@condo/domains/subscription/constants')

const conf = process.env
const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}

const { logger: baseLogger } = require('../common')
const { dvSenderFields, BANK_OPERATION_CODE } = require('../constants')
const { SBBOL_OFFER_ACCEPT_IS_NULL_ERROR, SBBOL_OFFER_ACCEPT_HAS_INCORRECT_PAYER_REQUISITES_ERROR } = require('@condo/domains/subscription/constants/errors')

const logger = baseLogger.child({ module: 'syncPaymentRequestsForSubscriptions' })

// TODO(antonal): Add 3 days for trial subscription when payment is emitted to compensate payment processing lag and subsequent in service unavailability

const postPaymentRequestFor = async (subscription, fintechApi) => {
    const { keystone: context } = await getSchemaCtx('ServiceSubscriptionPayment')
    logger.info({ message: 'Start postPaymentRequestsFor', subscription })

    if (!subscription.sbbolOfferAccept) {
        logger.error({
            message: 'Latest ServiceSubscription does not have information about offer accept',
            error: SBBOL_OFFER_ACCEPT_IS_NULL_ERROR,
            subscription,
        })
        return
    }

    const { payerAccount, payerBankBic, payerBankCorrAccount, payerInn, payerName } = subscription.sbbolOfferAccept

    if (!payerAccount || !payerBankBic || !payerBankCorrAccount || !payerInn || !payerName) {
        logger.error({
            message: 'Latest ServiceSubscription has insufficient data in offer accept',
            error: SBBOL_OFFER_ACCEPT_HAS_INCORRECT_PAYER_REQUISITES_ERROR,
            subscription,
        })
        return
    }

    const data = {
        ...dvSenderFields,
        type: SUBSCRIPTION_TYPE.SBBOL,
        status: SUBSCRIPTION_PAYMENT_STATUS.CREATED,
        amount: String(SBBOL_YEARLY_SUBSCRIPTION_PRICE),
        currency: SUBSCRIPTION_PAYMENT_CURRENCY.RUB,
        subscription: { connect: { id: subscription.id } },
        organization: { connect: { id: subscription.organization.id } },
    }

    const newPayment = await ServiceSubscriptionPayment.create(context, data)
    if (!newPayment) {
        logger.error({
            message: 'Error by creating ServiceSubscriptionPayment',
            data,
        })
        return
    }

    logger.info({
        message: 'Created ServiceSubscriptionPayment',
        record: newPayment,
    })

    const today = dayjs()

    const { payeeAccount, payeeBankBic, payeeBankCorrAccount, payeeInn, payeeName } = SBBOL_FINTECH_CONFIG.payee

    const response = await fintechApi.postPaymentRequest({
        acceptanceTerm: '5',
        amount: String(SBBOL_YEARLY_SUBSCRIPTION_PRICE),
        //bankComment: '', // This field will be filled by bank. Documentation in SBBOL is wrong.
        //bankStatus: '', // This field will be filled by bank. Documentation in SBBOL is wrong.
        //crucialFieldsHash: '', // This field will be filled by bank. It's optional for us to calculate hash. Documentation in SBBOL is wrong.
        date: today.format('YYYY-MM-DD'),
        deliveryKind: 'электронно',
        externalId: newPayment.id,
        //number: '', // This field will be filled by bank, unless it's not provided by us. Documentation in SBBOL is wrong.
        operationCode: BANK_OPERATION_CODE.BUYING,
        payeeAccount,
        payeeBankBic,
        payeeBankCorrAccount,
        payeeInn,
        payeeName,
        payerAccount,
        payerBankBic,
        payerBankCorrAccount,
        payerInn,
        payerName,
        paymentCondition: '1',
        priority: '1',
        purpose: `Оплата подписки СББОЛ на период с ${today.format('YYYY-MM-DD')} по ${today.add(1, 'year').format('YYYY-MM-DD')}`,
        vat: {
            amount: 0,
            rate: 0,
            type: 'NO_VAT',
        },
        voCode: '61150',
    })

    if (response.data) {
        const { data } = response
        await ServiceSubscriptionPayment.update(context, newPayment.id, {
            meta: data,
            externalId: data.number,
        })
    } else {
        const { error } = response
        await ServiceSubscriptionPayment.update(context, newPayment.id, {
            status: SUBSCRIPTION_PAYMENT_STATUS.ERROR,
            meta: error,
        })
    }
}

/**
 * For each expired SBBOL-subscription post payment request to SBBOL
 */
const syncPaymentRequestsForSubscriptions = async () => {
    logger.info({ message: 'Start', function: 'syncPaymentRequestsForSubscriptions' })
    const { keystone: context } = await getSchemaCtx('ServiceSubscription')

    const fintechApi = await initSbbolFintechApi(context)
    if (!fintechApi) return

    const today = dayjs()
    // By product case it is supposed to automatically renew expired paid SBBOL-subscription, not only trial.
    // That's why `isTrial` is missing in `where` conditions.
    const where = {
        type: SUBSCRIPTION_TYPE.SBBOL,
        finishAt_lt: today.toISOString(),
    }
    const expiredSubscriptions = await ServiceSubscription.getAll(context, where)

    if (expiredSubscriptions.length === 0) {
        logger.info({
            message: 'No expired subscriptions found for today',
            where,
        })
    } else {
        logger.info({
            message: 'Found expired ServiceSubscription records',
            count: expiredSubscriptions.length,
            where,
        })
        expiredSubscriptions.map(async (expiredSubscription) => {
            // Payments without external id are not created at SBBOL side
            // Try to repost them
            const paymentsForSubscription = await ServiceSubscriptionPayment.getAll(context, {
                subscription: { id: expiredSubscription.id },
                externalId_not: null,
            })
            if (paymentsForSubscription.length === 0) {
                await postPaymentRequestFor(expiredSubscription, fintechApi)
            } else {
                logger.info({
                    message: 'Subscription already has payments',
                    subscription: expiredSubscription,
                    paymentsCount: paymentsForSubscription.length,
                })
            }
        })
    }
}

module.exports = {
    syncPaymentRequestsForSubscriptions,
}