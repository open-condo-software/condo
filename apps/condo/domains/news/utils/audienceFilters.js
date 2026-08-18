const {
    NEWS_ITEM_SCOPE_TYPE_ORGANIZATION,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
    NEWS_ITEM_SCOPE_TYPE_UNKNOWN,
} = require('@condo/domains/news/constants/scopesTypes')

const NEWS_AUDIENCE_ALL = 'all'
const NEWS_AUDIENCE_PERSONAL = 'personal'
const NEWS_AUDIENCE_COMMON = 'common'

const BROAD_SCOPE_TYPES = [
    NEWS_ITEM_SCOPE_TYPE_ORGANIZATION,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE,
    NEWS_ITEM_SCOPE_TYPE_UNKNOWN,
]

/**
 * Personal ≈ unit-targeted news (property + unitType + unitName scopes only).
 * Common ≈ organization / property / section wide (or mixed) audience.
 *
 * Exact "exactly one resident" needs a denormalized field; this approximation matches
 * debt news (1 unit scope) and usual mass news (org/property scopes).
 */
const getPersonalAudienceWhere = () => ({
    AND: [
        {
            scopes_some: {
                deletedAt: null,
                type: NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
            },
        },
        {
            scopes_none: {
                deletedAt: null,
                type_in: BROAD_SCOPE_TYPES,
            },
        },
    ],
})

const getCommonAudienceWhere = () => ({
    OR: [
        {
            scopes_some: {
                deletedAt: null,
                type_in: BROAD_SCOPE_TYPES,
            },
        },
        {
            scopes_none: {
                deletedAt: null,
                type: NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
            },
        },
    ],
})

const getNewsAudienceFilter = () => {
    return function getWhereQuery (option) {
        if (!option || option === NEWS_AUDIENCE_ALL) return

        if (option === NEWS_AUDIENCE_PERSONAL) {
            return getPersonalAudienceWhere()
        }

        if (option === NEWS_AUDIENCE_COMMON) {
            return getCommonAudienceWhere()
        }
    }
}

module.exports = {
    NEWS_AUDIENCE_ALL,
    NEWS_AUDIENCE_PERSONAL,
    NEWS_AUDIENCE_COMMON,
    getNewsAudienceFilter,
    getPersonalAudienceWhere,
    getCommonAudienceWhere,
}
