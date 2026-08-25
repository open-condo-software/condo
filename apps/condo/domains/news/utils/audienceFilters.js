const {
    NEWS_ITEM_SCOPE_TYPE_ORGANIZATION,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
    NEWS_ITEM_SCOPE_TYPE_UNKNOWN,
} = require('@condo/domains/news/constants/scopesTypes')

/** @typedef {import('@app/condo/schema').NewsItemScopeTypeType} NewsItemScopeTypeType */

const NEWS_AUDIENCE_ALL = 'all'
const NEWS_AUDIENCE_PERSONAL = 'personal'
const NEWS_AUDIENCE_COMMON = 'common'

/** @type {NewsItemScopeTypeType[]} */
const BROAD_SCOPE_TYPES = [
    NEWS_ITEM_SCOPE_TYPE_ORGANIZATION,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE,
    NEWS_ITEM_SCOPE_TYPE_UNKNOWN,
]

/** @type {NewsItemScopeTypeType} */
const PERSONAL_SCOPE_TYPE = NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME

/**
 * Personal = news sent to exactly one apartment.
 * `scopesCount` is denormalized at publish time (stays 0 for drafts).
 * Combined with unit-scope type checks so a single org/property scope is not personal.
 * Root `deletedAt: null` is required: nested `deletedAt` on scopes disables
 * the softDeleted plugin's default filter on NewsItem.
 *
 * Common = everything that is not personal (org / property / section, mixed,
 * or several apartments). Keystone where has no NOT, so this is the De Morgan
 * of the personal AND.
 */
const getPersonalAudienceWhere = () => ({
    AND: [
        {
            deletedAt: null,
        },
        {
            scopesCount: 1,
        },
        {
            scopes_some: {
                deletedAt: null,
                type: PERSONAL_SCOPE_TYPE,
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
    AND: [
        {
            deletedAt: null,
        },
        {
            OR: [
                {
                    scopesCount_not: 1,
                },
                {
                    scopes_some: {
                        deletedAt: null,
                        type_in: BROAD_SCOPE_TYPES,
                    },
                },
                {
                    scopes_none: {
                        deletedAt: null,
                        type: PERSONAL_SCOPE_TYPE,
                    },
                },
            ],
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
