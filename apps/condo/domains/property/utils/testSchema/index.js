/**
 * Generated by `createschema property.Property 'organization:Text; name:Text; address:Text; addressMeta:Json; type:Select:building,village; map?:Json'`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */
const faker = require('faker')
const {throwIfError} = require("@condo/domains/common/utils/codegeneration/generate.test.utils");
const { buildingMapJson } = require('@condo/domains/property/constants/property')
const { generateGQLTestUtils } = require('@condo/domains/common/utils/codegeneration/generate.test.utils')
const { Property: PropertyGQL } = require('@condo/domains/property/gql')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')

const { CHECK_PROPERTY_WITH_ADDRESS_EXIST_QUERY } = require('@condo/domains/property/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const Property = generateGQLTestUtils(PropertyGQL)

/* AUTOGENERATE MARKER <CONST> */

async function createTestProperty (client, organization, extraAttrs = {}) {
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

async function updateTestProperty (client, id, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!id) throw new Error('no id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }
    const obj = await Property.update(client, id, attrs)
    return [obj, attrs]
}

async function makeClientWithProperty () {
    const client = await makeClientWithRegisteredOrganization()
    const [property] = await createTestProperty(client, client.organization, { map: buildingMapJson })
    client.property = property
    return client
}

async function checkPropertyWithAddressExistByTestClient(client, extraAttrs = {}) {
    if (!client) throw new Error('no client')

    const attrs = {
        ...extraAttrs,
    }
    const { data, errors } = await client.query(CHECK_PROPERTY_WITH_ADDRESS_EXIST_QUERY, { data: attrs })
    throwIfError(data, errors)
    return [data.result, attrs]
}
/* AUTOGENERATE MARKER <FACTORY> */

module.exports = {
    Property,
    createTestProperty,
    updateTestProperty,
    makeClientWithProperty,
    checkPropertyWithAddressExistByTestClient
/* AUTOGENERATE MARKER <EXPORTS> */
}
