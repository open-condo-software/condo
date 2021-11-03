const { logger: baseLogger } = require('../common')
const { SbbolRequestApi } = require('../SbbolRequestApi')
const { getSchemaCtx } = require('@core/keystone/schema')
const { SbbolFintechApi } = require('../SbbolFintechApi')
const { ServiceSubscriptionPayment, ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { SUBSCRIPTION_PAYMENT_STATUS, SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { executeInSequence } = require('@condo/domains/common/utils/parallel')
const { SBBOL_PAYMENT_STATUS_MAP, dvSenderFields } = require('../constants')
const { get } = require('lodash')
const dayjs = require('dayjs')

const conf = process.env
const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

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

    let accessToken
    try {
        // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that used to obtain accessToken
        // for organization, that will be queried in SBBOL using `SbbolFintechApi`.
        accessToken = await SbbolRequestApi.getOrganizationAccessToken(SBBOL_FINTECH_CONFIG.service_organization_hashOrgId)
    } catch (e) {
        logger.error({
            message: 'Failed to obtain organization access token from SBBOL',
            error: e.message,
            hashOrgId: SBBOL_FINTECH_CONFIG.service_organization_hashOrgId,
        })
        return
    }

    const fintechApi = new SbbolFintechApi({
        accessToken,
        host: SBBOL_FINTECH_CONFIG.host,
        port: SBBOL_FINTECH_CONFIG.port,
        certificate: SBBOL_PFX.certificate,
        passphrase: SBBOL_PFX.passphrase,
    })

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