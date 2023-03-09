const { queryHasField } = require('./queryHasField')
const DELETED_AT_FIELD = 'deletedAt'

describe('queryHasField', () => {

    const SIMPLE_LOGICAL_QUERY = {
        OR: [
            {
                foo: null,
            },
            {
                bar: null,
            },
        ],
    }

    const COMPLEX_QUERY = {
        property: {
            OR: [
                {
                    foo: null,
                },
                {
                    bar: null,
                },
            ],
            AND: [
                {
                    foo: null,
                },
                {
                    bar: null,
                },
            ],
        },
        account: {
            id: null,
        },
    }

    test('on empty query => false', () => {
        expect(queryHasField({}, DELETED_AT_FIELD)).toEqual(false)
    })

    test('on simple query without deletedAt => false', () => {

        const SIMPLE_QUERY = {
            foo: 'bar',
        }

        expect(queryHasField(SIMPLE_QUERY, DELETED_AT_FIELD)).toEqual(false)
    })

    test('on simple query with deletedAt => true', () => {
        const simpleQueryWithDeletedAt = {
            deletedAt: null,
        }
        expect(queryHasField(simpleQueryWithDeletedAt, DELETED_AT_FIELD)).toEqual(true)
    })

    test('on simple logical query without deletedAt => false', () => {
        expect(queryHasField(SIMPLE_LOGICAL_QUERY, DELETED_AT_FIELD)).toEqual(false)
    })

    test('on simple logical query with deletedAt => true', () => {
        const customQuery = { ...{}, ...SIMPLE_LOGICAL_QUERY }
        customQuery.OR[0] = { deletedAt: null }
        expect(queryHasField(customQuery, DELETED_AT_FIELD)).toEqual(true)
    })

    test('on complex logical query without deletedAt => false', () => {
        expect(queryHasField(COMPLEX_QUERY, DELETED_AT_FIELD)).toEqual(false)
    })

    test('on complex logical query with deletedAt 1 => true', () => {
        const customQuery = { ...{}, ...COMPLEX_QUERY }
        customQuery.deletedAt = 'null'
        expect(queryHasField(customQuery, DELETED_AT_FIELD)).toEqual(true)
    })

    test('on complex logical query with deletedAt 2 => true', () => {
        const customQuery = { ...{}, ...COMPLEX_QUERY }
        customQuery.property = { deletedAt: null }
        expect(queryHasField(customQuery, DELETED_AT_FIELD)).toEqual(true)
    })

    test('on complex logical query with deletedAt 3 => true', () => {
        const customQuery = { ...{}, ...COMPLEX_QUERY }
        customQuery.property.OR.push({ deletedAt: null })
        expect(queryHasField(customQuery, DELETED_AT_FIELD)).toEqual(true)
    })

    test('on complex logical query with deletedAt 4 => true', () => {
        const customQuery = { ...{}, ...COMPLEX_QUERY }
        customQuery.property.OR.push({ OR: [{ deletedAt: null }, { deletedAt_not: null }] })
        expect(queryHasField(customQuery, DELETED_AT_FIELD)).toEqual(true)
    })
})
