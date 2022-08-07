const { logger: baseLogger } = require('../common')
const { getSchemaCtx } = require('@condo/keystone/schema')
const { initSbbolFintechApi } = require('../SbbolFintechApi')
const { ServiceSubscriptionPayment, ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { SUBSCRIPTION_PAYMENT_STATUS, SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { executeInSequence } = require('@condo/domains/common/utils/parallel')
const { SBBOL_PAYMENT_STATUS_MAP, dvSenderFields } = require('../constants')
const { get } = require('lodash')
const dayjs = require('dayjs')

const logger = baseLogger.child({ module: 'syncSbbolSubscriptionPaymentRequestsState' })

const syncSbbolSubscriptionPaymentRequestStateFor = async (payment, fintechApi) => {
    const { data, error } = await fintechApi.getPaymentRequestState(payment.id)
    if (error) {
        logger.error({ message: 'Error fetching status for payment', error, payment })
    } else {
        const { keystone: context } = await getSchemaCtx('ServiceSubscriptionPayment')
        if (!data.bankStatus) {
            logger.error({
                message: 'Status response does not contains "bankStatus" field. Maybe, something was changed in setup of SBBOL Fintech API or in API itself.',
            })
        } else {
            if (get(payment.statusMeta, 'bankStatus') !== data.bankStatus) {
                const status = SBBOL_PAYMENT_STATUS_MAP[data.bankStatus]
                if (!status) {
                    logger.error({
                        message: 'Value of bankStatus from SBBOL Fintech API cannot be mapped to status values of ServiceSubscriptionPayment, because it does not belongs to the list of known statuses. Consider to add it.',
                        bankStatus: data.bankStatus,
                    })
                } else {
                    await ServiceSubscriptionPayment.update(context, payment.id, {
                        status,
                        statusMeta: data,
                    })
                }
                if (status === SUBSCRIPTION_PAYMENT_STATUS.DONE) {
                    const now = dayjs()
                    await ServiceSubscription.create(context, {
                        ...dvSenderFields,
                        type: SUBSCRIPTION_TYPE.SBBOL,
                        isTrial: false,
                        organization: { connect: { id: payment.organization.id } },
                        startAt: now.toISOString(),
                        finishAt: now.add(1, 'year').toISOString(),
                    })
                }
            }
        }
    }
}

const syncSbbolSubscriptionPaymentRequestsState = async () => {
    const { keystone: context } = await getSchemaCtx('ServiceSubscriptionPayment')

    const fintechApi = await initSbbolFintechApi(context)
    if (!fintechApi) return

    const { CREATED, PROCESSING, STOPPED } = SUBSCRIPTION_PAYMENT_STATUS

    const paymentsToSync = await ServiceSubscriptionPayment.getAll(context, {
        externalId_not: null,
        status_in: [CREATED, PROCESSING, STOPPED],
    }, { sortBy: ['updatedAt_DESC'] })

    if (paymentsToSync.length === 0) {
        logger.info({
            message: 'No ServiceSubscriptionPayment found with state CREATED, PROCESSING or STOPPED. Do nothing',
        })
    } else {
        const syncTasks = paymentsToSync.map(payment => () => syncSbbolSubscriptionPaymentRequestStateFor(payment, fintechApi))
        await executeInSequence(syncTasks)
    }
}


module.exports = {
    syncSbbolSubscriptionPaymentRequestsState,
}