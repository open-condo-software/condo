/**
 * Generated by `createschema contact.Contact 'property:Relationship:Property:SET_NULL; name:Text; phone:Text; unitName?:Text; email?:Text;'`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */
const faker = require('faker')
const { createTestPhone } = require('@condo/domains/user/utils/testSchema')
const { createTestEmail } = require('@condo/domains/user/utils/testSchema')

const { generateGQLTestUtils } = require('@condo/domains/common/utils/codegeneration/generate.test.utils')

const { Contact: ContactGQL } = require('@condo/domains/contact/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const Contact = generateGQLTestUtils(ContactGQL)
/* AUTOGENERATE MARKER <CONST> */

async function createTestContact (client, organization, property, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!organization || !organization.id) throw new Error('no organization.id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        organization: { connect: { id: organization.id } },
        property: { connect: { id: property.id } },
        unitName: faker.random.alphaNumeric(3),
        name: faker.name.firstName(),
        email: createTestEmail(),
        phone: createTestPhone(),
        ...extraAttrs,
    }
    const obj = await Contact.create(client, attrs)
    return [obj, attrs]
}

async function updateTestContact (client, id, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!id) throw new Error('no id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        name: faker.name.firstName(),
        email: createTestEmail(),
        phone: createTestPhone(),
        ...extraAttrs,
    }
    const obj = await Contact.update(client, id, attrs)
    return [obj, attrs]
}

/* AUTOGENERATE MARKER <FACTORY> */

module.exports = {
    Contact, createTestContact, updateTestContact,
/* AUTOGENERATE MARKER <EXPORTS> */
}
