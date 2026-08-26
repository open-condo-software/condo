import {
    NEWS_ITEM_SCOPE_TYPE_ORGANIZATION,
    NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
} from '@condo/domains/news/constants/scopesTypes'
import {
    NEWS_AUDIENCE_ALL,
    NEWS_AUDIENCE_COMMON,
    NEWS_AUDIENCE_PERSONAL,
    getNewsAudienceFilter,
} from '@condo/domains/news/utils/tables.utils'


describe('Table utils', () => {
    describe('getNewsAudienceFilter', () => {
        const filter = getNewsAudienceFilter()

        it('returns undefined for all / empty', () => {
            expect(filter(NEWS_AUDIENCE_ALL)).toBeUndefined()
            expect(filter(undefined)).toBeUndefined()
            expect(filter('')).toBeUndefined()
        })

        it('returns a single unit-scope where for personal', () => {
            const where = filter(NEWS_AUDIENCE_PERSONAL)

            expect(where).toEqual({
                AND: [
                    {
                        scopesCount: 1,
                    },
                    {
                        scopes_some: {
                            type: NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
                        },
                    },
                    {
                        scopes_none: {
                            type_in: expect.arrayContaining([NEWS_ITEM_SCOPE_TYPE_ORGANIZATION]),
                        },
                    },
                ],
            })
        })

        it('returns the complement of personal where for common', () => {
            const where = filter(NEWS_AUDIENCE_COMMON)

            expect(where).toEqual({
                AND: [
                    {
                        OR: [
                            {
                                scopesCount_not: 1,
                            },
                            {
                                scopes_some: {
                                    type_in: expect.arrayContaining([NEWS_ITEM_SCOPE_TYPE_ORGANIZATION]),
                                },
                            },
                            {
                                scopes_none: {
                                    type: NEWS_ITEM_SCOPE_TYPE_PROPERTY_UNIT_TYPE_UNIT_NAME,
                                },
                            },
                        ],
                    },
                ],
            })
        })
    })
})
