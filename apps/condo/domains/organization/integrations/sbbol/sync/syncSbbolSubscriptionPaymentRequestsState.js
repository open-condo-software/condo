const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { initSbbolFintechApi } = require('../SbbolFintechApi')
const { ServiceSubscriptionPayment, ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { SUBSCRIPTION_PAYMENT_STATUS, SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { executeInSequence } = require('@condo/domains/common/utils/parallel')
const { SBBOL_PAYMENT_STATUS_MAP, dvSenderFields } = require('../constants')
const { get } = require('lodash')
const dayjs = require('dayjs')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('sbbol/syncSbbolSubscriptionPaymentRequestsState')

const syncSbbolSubscriptionPaymentRequestStateFor = async (subscriptionPayment, fintechApi) => {
    const { data, error } = await fintechApi.getPaymentRequestState(subscriptionPayment.id)
    if (error) {
        logger.error({ msg: 'Error fetching status for payment', data: error, subscriptionPayment })
    } else {
        const { keystone: context } = await getSchemaCtx('ServiceSubscriptionPayment')
        if (!data.bankStatus) {
            logger.error({
                msg: 'Status response does not contains "bankStatus" field. Maybe, something was changed in setup of SBBOL Fintech API or in API itself.',
            })
        } else {
            if (get(subscriptionPayment.statusMeta, 'bankStatus') !== data.bankStatus) {
                const status = SBBOL_PAYMENT_STATUS_MAP[data.bankStatus]
                if (!status) {
                    logger.error({
                        msg: 'Value of bankStatus from SBBOL Fintech API cannot be mapped to status values of ServiceSubscriptionPayment, because it does not belongs to the list of known statuses. Consider to add it.',
                        bankStatus: data.bankStatus,
                    })
                } else {
                    await ServiceSubscriptionPayment.update(context, subscriptionPayment.id, {
                        ...dvSenderFields,
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
                        organization: { connect: { id: subscriptionPayment.organization.id } },
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

    const fintechApi = await initSbbolFintechApi()
    if (!fintechApi) return

    const { CREATED, PROCESSING, STOPPED } = SUBSCRIPTION_PAYMENT_STATUS

    const paymentsToSync = await ServiceSubscriptionPayment.getAll(context, {
        externalId_not: null,
        status_in: [CREATED, PROCESSING, STOPPED],
    }, { sortBy: ['updatedAt_DESC'] })

    if (paymentsToSync.length === 0) {
        logger.info('No ServiceSubscriptionPayment found with state CREATED, PROCESSING or STOPPED. Do nothing')
    } else {
        const syncTasks = paymentsToSync.map(payment => () => syncSbbolSubscriptionPaymentRequestStateFor(payment, fintechApi))
        await executeInSequence(syncTasks)
    }
}


module.exports = {
    syncSbbolSubscriptionPaymentRequestsState,
}