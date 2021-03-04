const faker = require('faker')
const { REGISTER_NEW_USER_MUTATION, User } = require('../../gql/User')
const { getRandomString } = require('@core/keystone/test.utils')
const { makeClient, makeLoggedInClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')

async function createUser (client, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    const sender = { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) }
    const name = faker.name.firstName()
    const email = ('test.' + getRandomString() + '@example.com').toLowerCase()
    const phone = '00' + String(Math.random()).slice(2).slice(-9)
    const password = getRandomString()
    const meta = {
        dv: 1, city: faker.address.city(), county: faker.address.county(),
    }

    const attrs = {
        dv: 1,
        sender,
        name, email, phone,
        password, meta,
        ...extraAttrs,
    }
    const obj = await User.create(client, attrs)
    return [obj, attrs]
}

async function registerNewUser (client, extraAttrs = {}, { raw = false } = {}) {
    if (!client) throw new Error('no client')
    const sender = { dv: 1, fingerprint: 'test-' + faker.random.alphaNumeric(8) }
    const name = faker.name.firstName()
    const email = ('test.' + getRandomString() + '@example.com').toLowerCase()
    // const phone = faker.phone.phoneNumber().replace(/[^0-9]/g, '')
    const password = getRandomString()
    const meta = {
        dv: 1, city: faker.address.city(), county: faker.address.county(),
    }

    const attrs = {
        dv: 1,
        sender,
        name, email,
        // phone,
        password, meta,
        ...extraAttrs,
    }

    const { data, errors } = await client.mutate(REGISTER_NEW_USER_MUTATION, {
        data: attrs,
    })
    if (raw) return { data, errors }
    expect(errors).toEqual(undefined)
    return [data.user, attrs]
}

async function makeClientWithNewRegisteredAndLoggedInUser () {
    const client = await makeClient()
    const [user, userAttrs] = await registerNewUser(client)
    client.user = user
    return await makeLoggedInClient(userAttrs)
}

async function addAdminAccess (user) {
    const admin = await makeLoggedInAdminClient()
    await User.update(admin, user.id, { isAdmin: true })
}

module.exports = {
    createUser,
    registerNewUser,
    addAdminAccess,
    makeClientWithNewRegisteredAndLoggedInUser,
}