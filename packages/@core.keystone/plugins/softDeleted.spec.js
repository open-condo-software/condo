const softDeleted = require('./softDeleted')

const DELETED_AT_FIELD = 'deletedAt'

test('on empty query => false', () => {
    expect(softDeleted._queryHasSoftDeletedFieldDeep({}, DELETED_AT_FIELD)).toEqual(false)
})

test('on simple query without deletedAt => false', () => {

    const SIMPLE_QUERY = {
        foo: 'bar',
    }

    expect(softDeleted._queryHasSoftDeletedFieldDeep(SIMPLE_QUERY, DELETED_AT_FIELD)).toEqual(false)
})

test('on simple query with deletedAt => true', () => {
    const simpleQueryWithDeletedAt = {
        deletedAt: null,
    }
    expect(softDeleted._queryHasSoftDeletedFieldDeep(simpleQueryWithDeletedAt, DELETED_AT_FIELD)).toEqual(true)
})

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

test('on simple logical query without deletedAt => false', () => {
    expect(softDeleted._queryHasSoftDeletedFieldDeep(SIMPLE_LOGICAL_QUERY, DELETED_AT_FIELD)).toEqual(false)
})

test('on simple logical query with deletedAt => true', () => {
    const customQuery = { ...{}, ...SIMPLE_LOGICAL_QUERY }
    customQuery.OR[0] = { deletedAt: null }
    expect(softDeleted._queryHasSoftDeletedFieldDeep(customQuery, DELETED_AT_FIELD)).toEqual(true)
})

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

test('on complex logical query without deletedAt => false', () => {
    expect(softDeleted._queryHasSoftDeletedFieldDeep(COMPLEX_QUERY, DELETED_AT_FIELD)).toEqual(false)
})

test('on complex logical query with deletedAt 1 => true', () => {
    const customQuery = { ...{}, ...COMPLEX_QUERY }
    customQuery.deletedAt = 'null'
    expect(softDeleted._queryHasSoftDeletedFieldDeep(customQuery, DELETED_AT_FIELD)).toEqual(true)
})

test('on complex logical query with deletedAt 2 => true', () => {
    const customQuery = { ...{}, ...COMPLEX_QUERY }
    customQuery.property = { deletedAt: null }
    expect(softDeleted._queryHasSoftDeletedFieldDeep(customQuery, DELETED_AT_FIELD)).toEqual(true)
})

test('on complex logical query with deletedAt 3 => true', () => {
    const customQuery = { ...{}, ...COMPLEX_QUERY }
    customQuery.property.OR.push({ deletedAt: null })
    expect(softDeleted._queryHasSoftDeletedFieldDeep(customQuery, DELETED_AT_FIELD)).toEqual(true)
})

test('on complex logical query with deletedAt 4 => true', () => {
    const customQuery = { ...{}, ...COMPLEX_QUERY }
    customQuery.property.OR.push({ OR: [{ deletedAt: null }, { deletedAt_not: null }] })
    expect(softDeleted._queryHasSoftDeletedFieldDeep(customQuery, DELETED_AT_FIELD)).toEqual(true)
})