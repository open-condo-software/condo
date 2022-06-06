const { initSbbolFintechApi } = require('../SbbolFintechApi')
const { logger: baseLogger } = require('../common')
const dayjs = require('dayjs')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')
const { SUBSCRIPTION_TRIAL_PERIOD_DAYS, SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { dvSenderFields } = require('../constants')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')
const { getSchemaCtx } = require('@core/keystone/schema')
const { Organization: OrganizationApi } = require('@condo/domains/organization/utils/serverSchema')


const conf = require('@core/config')
const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}

const logger = baseLogger.child({ module: 'syncSubscriptions' })

async function stop (subscription, context) {
    logger.info({ message: 'Stopping subscription', subscription })
    return await ServiceSubscription.update(context, subscription.id, {
        ...dvSenderFields,
        finishAt: dayjs().toISOString(),
    })
}

/**
 * Create or cancel SBBOL subscription, according to changes in advance acceptance
 * @param {AdvanceAcceptance} advanceAcceptance
 * @param active
 * @param context
 * @return {Promise<void>}
 */
const syncSubscriptionsFor = async (advanceAcceptance) => {
    const { payerInn, active } = advanceAcceptance
    const { keystone: context } = await getSchemaCtx('User')

    const [organization] = await OrganizationApi.getAll(context,
        { tin: payerInn },
        { sortBy: 'createdAt_DESC' },
    )

    if (!organization) {
        logger.warn({ message: 'Not found organization to sync SBBOL subscriptions for', payerInn })
        return
    }

    // TODO: What to do with multiple organizations with same inn?
    // Tests will always trigger this error after several passes over the same database
    // if (result.length > 1) {
    //     throw new Error('Multiple organizations with the same inn exists. Its unknown, for what specific organization to create SBBOL subscription')
    // }

    const existingSubscriptions = await ServiceSubscription.getAll(context, {
        organization: {
            id: organization.id,
        },
        finishAt_gt: dayjs().toISOString(),
    })
    const existingSubscription = existingSubscriptions[0]

    if (existingSubscriptions.length > 1) {
        logger.error({ message: 'More than one subscription found for Organization', id: organization.id })
    }

    // Client has accepted our offer
    if (active) {
        // TODO: add trial for additional day when client accepts previously revoked (after accepting) offer

        logger.info({ message: 'User from organization has accepted our offer in SBBOL', payerInn })

        // In case of accepted SBBOL offer new subscription should be started and all current subscriptions will make no sense.
        // If active one is present, stop it by cutting it's period until now.
        // It covers following cases:
        // - When new organization was created and trial default subscription was created
        // - When user has default subscription (trial or not)
        if (existingSubscription) {
            await stop(existingSubscription, context)
        }

        const now = dayjs()
        const trialServiceSubscription = await ServiceSubscription.create(context, {
            ...dvSenderFields,
            type: SUBSCRIPTION_TYPE.SBBOL,
            isTrial: true,
            organization: { connect: { id: organization.id } },
            startAt: now.toISOString(),
            finishAt: now.add(SUBSCRIPTION_TRIAL_PERIOD_DAYS, 'days').toISOString(),
            sbbolOfferAccept: {
                dv: 1,
                ...advanceAcceptance, // TODO: Figure out, why it crashes here on `payerInn` field
            },
        })
        logger.info({ message: 'Created trial subscription for SBBOL', serviceSubscription: trialServiceSubscription })
    } else {
        logger.info({ message: 'User from organization has declined our offer in SBBOL', payerInn })
        if (existingSubscription.type === SUBSCRIPTION_TYPE.SBBOL) {
            await stop(existingSubscription, context)
        }
    }
}

/**
 * Fetches changes in subscriptions from SBBOL for specified date and creates or stops
 * ServiceSubscriptions, accordingly.
 *
 * @param {String|null} date stringified day in format 'YYYY-MM-DD'
 * @return {Promise<void>}
 */
const syncSubscriptions = async (date = null) => {
    if (!date) date = dayjs().format('YYYY-MM-DD')
    const { keystone: context } = await getSchemaCtx('ServiceSubscription')

    const fintechApi = await initSbbolFintechApi(context)
    if (!fintechApi) return

    logger.info({ message: 'Checking, whether the user have ServiceSubscription items' })

    const advanceAcceptances = await fintechApi.fetchAdvanceAcceptances({ date, clientId: SBBOL_FINTECH_CONFIG.client_id })

    if (advanceAcceptances.length === 0) {
        logger.info({ message: 'SBBOL returned no changes in offers, do nothing' })
    } else {
        await processArrayOf(advanceAcceptances).inSequenceWith(syncSubscriptionsFor)
    }
}

module.exports = {
    syncSubscriptions,
}