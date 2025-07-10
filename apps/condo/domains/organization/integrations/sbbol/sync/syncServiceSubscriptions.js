const dayjs = require('dayjs')
const { filter, map } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { SUBSCRIPTION_SBBOL_PERIOD_DAYS, SUBSCRIPTION_TYPE } = require('@condo/domains/subscription/constants')
const { ServiceSubscription } = require('@condo/domains/subscription/utils/serverSchema')

const { dvSenderFields } = require('../constants')

const logger = getLogger('sbbol-sync-subscriptions')

async function stop (subscription, context, organization) {
    logger.info({
        msg: 'stopping subscription',
        entityId: organization.id,
        entity: 'Organization',
        data: {
            serviceSubscriptionId: subscription.id,
        },
    })
    return await ServiceSubscription.update(context, subscription.id, {
        ...dvSenderFields,
        finishAt: dayjs().toISOString(),
    })
}

/**
 * Creates ServiceSubscription with type of SBBOL for Organization with specified TIN.
 * @param {String} tin - Tax Identification Number of organization at SBBOL side
 * @return {Promise<void>}
 */
const syncServiceSubscriptions = async (tin) => {
    const { keystone: context } = getSchemaCtx('User')

    const [organization] = await Organization.getAll(context,
        { tin },
        'id',
        { sortBy: 'createdAt_DESC' },
    )

    if (!organization) {
        logger.warn({
            msg: 'not found organization to sync ServiceSubscription for',
            data: { tin },
        })
        return
    }

    const activeSubscriptions = await ServiceSubscription.getAll(context, {
        organization: {
            id: organization.id,
        },
        finishAt_gt: dayjs().toISOString(),
    },
    'id type',
    {
        sortBy: ['createdAt_DESC'],
    })

    const activeDefaultSubscriptions = filter(activeSubscriptions, { type: SUBSCRIPTION_TYPE.DEFAULT })

    if (activeDefaultSubscriptions.length > 1) {
        logger.warn({
            msg: 'more than one active ServiceSubscription(type="default") found for Organization',
            entityId: organization.id,
            entity: 'Organization',
            data: {
                serviceSubscriptionIds: map(activeDefaultSubscriptions, 'id'),
            },
        })
    }

    for (let activeSubscription of activeDefaultSubscriptions) {
        // In case when user signs-in/registers via SBBOL, all non-SBBOL subscriptions should be stopped and new SBBOL-subscription should be started.
        // If active one is present, stop it by cutting it's period until now.
        // It covers following cases:
        // - When new organization was created and trial default subscription was created
        // - When user has default subscription (trial or not)
        await stop(activeSubscription, context, organization)
    }

    const existingSbbolSubscriptions = filter(activeSubscriptions, { type: SUBSCRIPTION_TYPE.SBBOL })

    if (existingSbbolSubscriptions.length > 1) {
        logger.warn({
            msg: 'More than one ServiceSubscription(type="sbbol") found for Organization',
            entityId: organization.id,
            entity: 'Organization',
            data: {
                serviceSubscriptionIds: map(existingSbbolSubscriptions, 'id'),
            },
        })
    }

    if (existingSbbolSubscriptions.length === 0) {
        const now = dayjs()
        const newSbbolSubscription = await ServiceSubscription.create(context, {
            ...dvSenderFields,
            type: SUBSCRIPTION_TYPE.SBBOL,
            isTrial: false,
            organization: { connect: { id: organization.id } },
            startAt: now.toISOString(),
            finishAt: now.add(SUBSCRIPTION_SBBOL_PERIOD_DAYS, 'days').toISOString(),
        })
        logger.info({
            msg: 'created SBBOL subscription',
            entityId: organization.id,
            entity: 'Organization',
            data: {
                serviceSubscriptionId: newSbbolSubscription.id,
            },
        })
    }
}

module.exports = {
    syncServiceSubscriptions,
}