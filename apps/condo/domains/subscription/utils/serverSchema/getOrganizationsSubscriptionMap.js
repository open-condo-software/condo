const dayjs = require('dayjs')
const chunk = require('lodash/chunk')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const logger = getLogger()
const CHUNK_SIZE = 100
const APP_FIELDS = new Set(['b2bApps', 'b2cApps'])

function buildSubscriptionFragment (condition) {
    if (!condition) return '{ activeSubscriptionEndAt }'

    const conditions = Array.isArray(condition) ? condition : [condition]
    const fieldParts = conditions.map(cond =>
        APP_FIELDS.has(cond) ? `${cond} { id endAt }` : `${cond}EndAt`
    )

    return `{ ${fieldParts.join(' ')} }`
}

function checkSubscription (subscription, condition) {
    const now = dayjs()

    if (!condition) {
        const endAt = get(subscription, 'activeSubscriptionEndAt')
        return Boolean(endAt) && dayjs(endAt).isAfter(now)
    }

    const conditions = Array.isArray(condition) ? condition : [condition]
    return conditions.every(cond => {
        if (APP_FIELDS.has(cond)) {
            const apps = get(subscription, cond, [])
            return Array.isArray(apps) && apps.some(app => Boolean(app.endAt) && dayjs(app.endAt).isAfter(now))
        }
        const endAt = get(subscription, `${cond}EndAt`)
        return Boolean(endAt) && dayjs(endAt).isAfter(now)
    })
}

/**
 * Returns a map of organizationId -> whether the organization has an active subscription.
 * Queries organizations in chunks of 100. When subscriptions are globally disabled,
 * the virtual subscription field returns far-future dates, so all organizations return true.
 *
 * @param {object} context - keystone context
 * @param {string[]} organizationIds
 * @param {string|string[]|null} condition - subscription field(s) to check.
 *   A feature name like 'meters' or 'payments' checks the corresponding endAt date.
 *   'b2bApps' or 'b2cApps' checks whether the organization has at least one active app.
 *   An array checks all conditions (AND). Omit to check only the base subscription.
 * @returns {Promise<Map<string, boolean>>}
 */
async function getOrganizationsSubscriptionMap (context, organizationIds, condition = null) {
    const result = new Map()
    if (!organizationIds.length) return result

    const subscriptionFragment = buildSubscriptionFragment(condition)
    const chunks = chunk(organizationIds, CHUNK_SIZE)

    for (const ids of chunks) {
        const orgs = await Organization.getAll(
            context,
            { id_in: ids, deletedAt: null },
            `id subscription ${subscriptionFragment}`,
        )

        for (const org of orgs) {
            const hasSubscription = checkSubscription(org.subscription, condition)
            if (!hasSubscription) {
                logger.info({ msg: 'organization has no active subscription', data: { organizationId: org.id } })
            }
            result.set(org.id, hasSubscription)
        }

        for (const id of ids) {
            if (!result.has(id)) {
                result.set(id, false)
            }
        }
    }

    return result
}

module.exports = { getOrganizationsSubscriptionMap }
