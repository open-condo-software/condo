const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const access = require('./access')

const ACCESS_FUNC = [
    access.userIsAdmin,
    access.userIsOwner, access.userIsAdminOrOwner,
    access.userIsThisItem, access.userIsAdminOrIsThisItem,
]

const BASE_USER = {
    id: faker.datatype.uuid(),
}

describe('Access utils tests', () => {
    describe('isFilteringBy', () => {
        const cases = [
            ['Basic field filtering 1', { field_in: ['123', '123'] }, ['field'], true],
            ['Basic field filtering 2', { field_not_contains_i: '123' }, ['field'], true],
            ['Multiple fields', { myField_not: null, field_in: ['123'] }, ['myField'], true],
            ['Multiple search fields', { myField_not: null, field_in: ['123'] }, ['noMatch', 'field'], true],
            ['AND/OR', { AND: [ { OR: [ { field_i: '123' } ] } ] }, ['field'], true],
            ['Relation', { relation: { id: '123' } }, ['relation'], true],
            ['No matches', { someField: null }, ['otherField'], false],
            ['No matches with AND/OR', { AND: [ { OR: [ { field_i: '123' } ] } ] }, ['otherField'], false],
        ]
        test.each(cases)('%p', (_, where, fields, expected) => {
            expect(access.isFilteringBy(where, fields)).toEqual(expected)
        })
    })

    describe('User access tests', () => {
        test('on empty obj => throw auth error', () => {
            ACCESS_FUNC.forEach((fn) => {
                let thrownError
                try {
                    fn({ authentication: {} })
                } catch (e) {
                    thrownError = e
                }
                expect(thrownError).toBeDefined()
                expect(thrownError.message).toEqual('No or incorrect authentication credentials')
            })
        })

        test('on deleted user => return false', () => {
            ACCESS_FUNC.forEach((fn) => {
                const result = fn({ authentication: { listKey: 'User', item: { ...BASE_USER, deletedAt: dayjs().toISOString() } } })
                expect(result).toEqual(false)
            })
        })

        test('userIsAdmin', () => {
            expect(access.userIsAdmin({ authentication: { listKey: 'User', item: { ...BASE_USER, isAdmin: false } } })).toEqual(false)
            expect(access.userIsAdmin({ authentication: { listKey: 'User', item: { ...BASE_USER, isAdmin: true } } })).toEqual(true)
        })

        test('userIsOwner', () => {
            expect(access.userIsOwner({ authentication: { listKey: 'User', item: { ...BASE_USER, isAdmin: false } } })).toEqual(false)
            expect(access.userIsOwner({ authentication: { listKey: 'User', item: { ...BASE_USER, isAdmin: true } } })).toEqual(false)
            expect(access.userIsOwner({ existingItem: {}, authentication: { listKey: 'User', item: { ...BASE_USER, isAdmin: true } } })).toEqual(false)
            expect(access.userIsOwner({
                existingItem: { user: BASE_USER },
                authentication: { listKey: 'User', item: { ...BASE_USER, id: faker.datatype.uuid(), isAdmin: true } },
            })).toEqual(false)
            expect(access.userIsOwner({
                existingItem: { user: BASE_USER },
                authentication: { listKey: 'User', item: { ...BASE_USER } },
            })).toEqual(true)
        })
    })
})