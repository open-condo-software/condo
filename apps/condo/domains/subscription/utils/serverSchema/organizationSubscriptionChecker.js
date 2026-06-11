const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const logger = getLogger()

/**
 * Creates a function that checks whether an organization has an active subscription.
 * When subscriptions are globally disabled, returns true for all organizations.
 * Each created function maintains its own cache to avoid redundant queries within a single task run.
 */
function createOrganizationSubscriptionChecker () {
    const cache = new Map()

    return async (context, organizationId) => {
        if (cache.has(organizationId)) {
            return cache.get(organizationId)
        }

        const org = await Organization.getOne(
            context,
            { id: organizationId, deletedAt: null },
            'id subscription { activeSubscriptionEndAt }',
        )

        const activeSubscriptionEndAt = get(org, ['subscription', 'activeSubscriptionEndAt'])
        const result = Boolean(activeSubscriptionEndAt) && dayjs(activeSubscriptionEndAt).isAfter(dayjs())

        if (!result) {
            logger.info({ msg: 'organization has no active subscription', data: { organizationId } })
        }

        cache.set(organizationId, result)

        return result
    }
}

module.exports = { createOrganizationSubscriptionChecker }
