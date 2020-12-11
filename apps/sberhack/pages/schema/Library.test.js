/**
 * @jest-environment node
 * @test-style 3
 */

const { makeClient, setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))
const faker = require('faker')
const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')
const { makeLoggedInClient } = require('@core/keystone/test.utils')
const { UUID_RE, DATETIME_RE } = require('@core/keystone/test.utils')

const { Library } = require('./Library.gql')

Library.DEFAULT_ORGANIZATION_ID = '1'

async function createLibrary (client, extraAttrs = {}) {
    const name = faker.address.streetAddress(true)
    const attrs = {
        organization: { connect: { id: Library.DEFAULT_ORGANIZATION_ID } },
        name,
        ...extraAttrs,
    }
    const obj = await Library.create(client, attrs)
    return [obj, attrs]
}

test('create library by minimal fields', async () => {
    const client = await makeLoggedInClient()
    const [obj, attrs] = await createLibrary(client)
    expect(obj.id).toMatch(UUID_RE)
    expect(obj.organization).toEqual(expect.objectContaining({ id: Property.DEFAULT_ORGANIZATION_ID }))
    expect(obj.name).toEqual(attrs.name)
    expect(obj.v).toEqual(1)
    expect(obj.newId).toEqual(null)
    expect(obj.deletedAt).toEqual(null)
    expect(obj.createdBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.updatedBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.createdAt).toMatch(DATETIME_RE)
    expect(obj.updatedAt).toMatch(DATETIME_RE)
})
