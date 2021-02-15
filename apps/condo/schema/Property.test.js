/**
 * @jest-environment node
 * @test-style 3
 */

const { setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))
const faker = require('faker')
const { makeLoggedInClient } = require('@core/keystone/test.utils')
const { UUID_RE, DATETIME_RE } = require('@core/keystone/test.utils')

const { buildingMapJson } = require('../constants/property.example')
const { Property } = require('./Property.gql')

Property.DEFAULT_ORGANIZATION_ID = '640eee89-a45d-4d3f-8b27-e63156c0c156'

async function createProperty (client, extraAttrs = {}) {
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const name = faker.address.streetAddress(true)
    const address = faker.address.streetAddress(true)
    const addressMeta = {
        dv: 1, city: faker.address.city(), zipCode: faker.address.zipCode(),
        street: faker.address.streetName(), number: faker.address.secondaryAddress(),
        county: faker.address.county(),
        address,
    }
    const attrs = {
        dv: 1,
        sender,
        organization: { connect: { id: Property.DEFAULT_ORGANIZATION_ID } },
        type: 'building',
        name, address, addressMeta,
        ...extraAttrs,
    }
    const obj = await Property.create(client, attrs)
    return [obj, attrs]
}

test('create property by minimal fields (dv, organization, sender, type, name, address, addressMeta)', async () => {
    const client = await makeLoggedInClient()
    const [obj, attrs] = await createProperty(client)
    expect(obj.id).toMatch(UUID_RE)
    expect(obj.dv).toEqual(1)
    expect(obj.sender).toStrictEqual(attrs.sender)
    expect(obj.organization).toEqual(expect.objectContaining({ id: Property.DEFAULT_ORGANIZATION_ID }))
    expect(obj.type).toEqual('building')
    expect(obj.name).toEqual(attrs.name)
    expect(obj.address).toEqual(attrs.address)
    expect(obj.addressMeta).toStrictEqual(attrs.addressMeta)
    expect(obj.map).toEqual(null)
    expect(obj.v).toEqual(1)
    expect(obj.newId).toEqual(null)
    expect(obj.deletedAt).toEqual(null)
    expect(obj.createdBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.updatedBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.createdAt).toMatch(DATETIME_RE)
    expect(obj.updatedAt).toMatch(DATETIME_RE)
})

test('update map for existing property (map)', async () => {
    const client = await makeLoggedInClient()
    const [obj1, attrs] = await createProperty(client)
    const obj = await Property.update(client, obj1.id, { dv: 1, sender: attrs.sender, map: buildingMapJson })
    expect(obj.dv).toEqual(1)
    expect(obj.sender).toStrictEqual(attrs.sender)
    expect(obj.organization).toEqual(expect.objectContaining({ id: Property.DEFAULT_ORGANIZATION_ID }))
    expect(obj.type).toEqual('building')
    expect(obj.name).toEqual(attrs.name)
    expect(obj.address).toEqual(attrs.address)
    expect(obj.addressMeta).toStrictEqual(attrs.addressMeta)
    expect(obj.map).toStrictEqual(buildingMapJson)
    expect(obj.v).toEqual(2)
    expect(obj.newId).toEqual(null)
    expect(obj.deletedAt).toEqual(null)
    expect(obj.createdBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.updatedBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.createdAt).toMatch(DATETIME_RE)
    expect(obj.updatedAt).toMatch(DATETIME_RE)
    expect(obj.updatedAt).not.toEqual(obj.createdAt)
})
