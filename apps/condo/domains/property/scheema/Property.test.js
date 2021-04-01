const faker = require('faker')
const { UUID_RE, DATETIME_RE } = require('@core/keystone/test.utils')

const { makeClientWithRegisteredOrganization } = require('../../../utils/testSchema/Organization')
const { buildingMapJson } = require('@condo/domains/common/constants/property.example')
const { Property } = require('@condo/domains/property/gql')

async function createProperty (client, organization, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!organization) throw new Error('no organization')
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
        organization: { connect: { id: organization.id } },
        type: 'building',
        name, address, addressMeta,
        ...extraAttrs,
    }
    const obj = await Property.create(client, attrs)
    return [obj, attrs]
}

async function makeClientWithProperty () {
    const client = await makeClientWithRegisteredOrganization()
    const [property] = await createProperty(client, client.organization, { map: buildingMapJson })
    client.property = property
    return client
}

describe('Property', () => {
    test('user: createProperty()', async () => {
        const client = await makeClientWithRegisteredOrganization()
        const [obj, attrs] = await createProperty(client, client.organization)
        expect(obj.id).toMatch(UUID_RE)
        expect(obj.dv).toEqual(1)
        expect(obj.sender).toStrictEqual(attrs.sender)
        expect(obj.organization).toEqual(expect.objectContaining({ id: client.organization.id }))
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

    test('user: update Property.map field for created property', async () => {
        const client = await makeClientWithRegisteredOrganization()
        const [obj1, attrs] = await createProperty(client, client.organization)
        const obj = await Property.update(client, obj1.id, { dv: 1, sender: attrs.sender, map: buildingMapJson })
        expect(obj.dv).toEqual(1)
        expect(obj.sender).toStrictEqual(attrs.sender)
        expect(obj.organization).toEqual(expect.objectContaining({ id: client.organization.id }))
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
})

module.exports = {
    createProperty,
    makeClientWithProperty,
}
