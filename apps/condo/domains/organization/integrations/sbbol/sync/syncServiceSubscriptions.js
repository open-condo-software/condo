const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID } = require('@condo/domains/common/constants/featureflags')
const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')
const { SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const { dvSenderFields } = require('../constants')

const logger = getLogger('sbbol-sync-subscriptions')

/**
 * Creates SubscriptionContext for Organization.
 * Uses feature flag ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID to get subscription plan ID.
 * @param {Object} context - Keystone context
 * @param {Object} organization - Organization object with id
 * @return {Promise<void>}
 */
const syncServiceSubscriptions = async ({ context, organization }) => {
    const subscriptionPlanId = await featureToggleManager.getFeatureValue(context, ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID)
    if (!subscriptionPlanId) {
        logger.info({
            msg: 'ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID not configured in feature flag, skipping SubscriptionContext creation',
            entityId: organization.id,
            entity: 'Organization',
        })
        return
    }

    if (typeof subscriptionPlanId !== 'string' || !UUID_REGEXP.test(subscriptionPlanId)) {
        logger.error({
            msg: 'ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID feature flag value is not a valid UUID',
            entityId: organization.id,
            entity: 'Organization',
            data: { subscriptionPlanId },
        })
        return
    }

    const [subscriptionPlan] = await find('SubscriptionPlan', { id: subscriptionPlanId, deletedAt: null })
    if (!subscriptionPlan) {
        logger.error({
            msg: 'SubscriptionPlan not found for ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID',
            entityId: organization.id,
            entity: 'Organization',
            data: { subscriptionPlanId },
        })
        return
    }

    const now = dayjs()
    const existingContexts = await find('SubscriptionContext', {
        organization: { id: organization.id },
        subscriptionPlan: { id: subscriptionPlanId },
        deletedAt: null,
        endAt: null,
    })
    if (existingContexts.length > 0) {
        return
    }

    const newContext = await SubscriptionContext.create(context, {
        ...dvSenderFields,
        organization: { connect: { id: organization.id } },
        subscriptionPlan: { connect: { id: subscriptionPlanId } },
        startAt: now.toISOString(),
        endAt: null,
        isTrial: false,
    })

    logger.info({
        msg: 'created SubscriptionContext for SBBOL organization',
        entityId: organization.id,
        entity: 'Organization',
        data: {
            subscriptionContextId: newContext.id,
            subscriptionPlanId,
        },
    })
}

module.exports = {
    syncServiceSubscriptions,
}