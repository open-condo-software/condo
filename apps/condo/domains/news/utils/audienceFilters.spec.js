/**
 * @jest-environment node
 */

const {
    NEWS_ITEM_SCOPE_TYPE_ORGANIZATION,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
} = require('@condo/domains/news/constants/scopesTypes')

const {
    NEWS_AUDIENCE_ALL,
    NEWS_AUDIENCE_COMMON,
    NEWS_AUDIENCE_PERSONAL,
    getNewsAudienceFilter,
} = require('./audienceFilters')

describe('getNewsAudienceFilter', () => {
    const filter = getNewsAudienceFilter()

    it('returns undefined for all / empty', () => {
        expect(filter(NEWS_AUDIENCE_ALL)).toBeUndefined()
        expect(filter(undefined)).toBeUndefined()
        expect(filter('')).toBeUndefined()
    })

    it('returns unit-only scopes where for personal', () => {
        const where = filter(NEWS_AUDIENCE_PERSONAL)

        expect(where).toEqual({
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
                        type_in: expect.arrayContaining([NEWS_ITEM_SCOPE_TYPE_ORGANIZATION]),
                    },
                },
            ],
        })
    })

    it('returns broad / non-unit where for common', () => {
        const where = filter(NEWS_AUDIENCE_COMMON)

        expect(where.OR).toHaveLength(2)
        expect(where.OR[0]).toEqual({
            scopes_some: {
                deletedAt: null,
                type_in: expect.arrayContaining([NEWS_ITEM_SCOPE_TYPE_ORGANIZATION]),
            },
        })
        expect(where.OR[1]).toEqual({
            scopes_none: {
                deletedAt: null,
                type: NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
            },
        })
    })
})
