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
