import { NewsItemScopeTypeType, NewsItemWhereInput } from '@app/condo/schema'

import { FilterType } from '@condo/domains/common/utils/tables.utils'
import {
    NEWS_ITEM_SCOPE_TYPE_ORGANIZATION,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
    NEWS_ITEM_SCOPE_TYPE_UNKNOWN,
} from '@condo/domains/news/constants/scopesTypes'


export const NEWS_AUDIENCE_ALL = 'all'
export const NEWS_AUDIENCE_PERSONAL = 'personal'
export const NEWS_AUDIENCE_COMMON = 'common'

const BROAD_SCOPE_TYPES: NewsItemScopeTypeType[] = [
    NEWS_ITEM_SCOPE_TYPE_ORGANIZATION,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE,
    NEWS_ITEM_SCOPE_TYPE_UNKNOWN,
]

const PERSONAL_SCOPE_TYPE: NewsItemScopeTypeType = NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME

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
const getPersonalAudienceWhere = (): NewsItemWhereInput => ({
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

const getCommonAudienceWhere = (): NewsItemWhereInput => ({
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

export const getNewsAudienceFilter = (): FilterType<NewsItemWhereInput> => {
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
