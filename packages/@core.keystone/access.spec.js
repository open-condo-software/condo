const access = require('./access')

const ACCESS_FUNC = [
    access.userIsAdmin,
    access.userIsOwner, access.userIsAdminOrOwner,
    access.userIsThisItem, access.userIsAdminOrIsThisItem,
]

test('on empty obj => false', () => {
    ACCESS_FUNC.forEach((fn) => {
        expect(fn({ authentication: {} })).toEqual(false)
    })
})

test('userIsAdmin', () => {
    expect(access.userIsAdmin({ authentication: { item: { isAdmin: false } } })).toEqual(false)
    expect(access.userIsAdmin({ authentication: { item: { isAdmin: true } } })).toEqual(true)
})

test('userIsOwner', () => {
    expect(access.userIsOwner({ authentication: { item: { isAdmin: false } } })).toEqual(false)
    expect(access.userIsOwner({ authentication: { item: { isAdmin: true } } })).toEqual(false)
    expect(access.userIsOwner({ existingItem: {}, authentication: { item: { isAdmin: true } } })).toEqual(false)
    expect(access.userIsOwner({
        existingItem: { user: { id: 1 } },
        authentication: { item: { isAdmin: true, id: 2 } },
    })).toEqual(false)
    expect(access.userIsOwner({
        existingItem: { user: { id: 1 } },
        authentication: { item: { isAdmin: true, id: 1 } },
    })).toEqual(true)
})
