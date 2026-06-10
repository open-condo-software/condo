const dayjs = require('dayjs')
const { get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const logger = getLogger()

/**
 * Returns true if the organization has an active subscription (activeSubscriptionEndAt is in the future).
 * When subscriptions are globally disabled, returns true for all organizations.
 * Results are cached in the provided Map to avoid redundant queries within the same task run.
 * @param {object} context - Keystone context
 * @param {string} organizationId
 * @param {Map} [cache] - optional Map to cache results by organizationId
 */
async function hasOrganizationActiveSubscription (context, organizationId, cache) {
    if (cache && cache.has(organizationId)) {
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

    if (cache) {
        cache.set(organizationId, result)
    }

    return result
}

module.exports = { hasOrganizationActiveSubscription }
