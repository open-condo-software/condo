/**
 * @jest-environment node
 */

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')
const { makeClientWithProperty, createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { createTestContact, Contact } = require('@condo/domains/contact/utils/testSchema')
const { createTestPhone } = require('@condo/domains/user/utils/testSchema')
const faker = require('faker')
const { deleteContactDuplicates } = require('./deleteContactDuplicates')
const { createTestTicket, Ticket } = require('@condo/domains/ticket/utils/testSchema')
const index = require('@app/condo/index')

describe('delete contact duplicates', () => {
    setFakeClientMode(index)

    test('only the last created contact with the same phone number remains', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const userClient = await makeClientWithProperty()
        const [organization] = await createTestOrganization(adminClient)
        const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, {
            canManageContacts: true,
        })
        await createTestOrganizationEmployee(adminClient, organization, userClient.user, role)

        const name1 = faker.random.alphaNumeric(8)
        const name2 = faker.random.alphaNumeric(8)
        const name3 = faker.random.alphaNumeric(8)
        const phone = createTestPhone()
        const unitName = faker.random.alphaNumeric(8)

        const [duplicateContact1] = await createTestContact(userClient, organization, userClient.property, {
            unitName,
            phone,
            name: name1,
        })
        const [duplicateContact2] = await createTestContact(userClient, organization, userClient.property, {
            unitName,
            phone,
            name: name2,
        })
        const [duplicateContact3] = await createTestContact(userClient, organization, userClient.property, {
            unitName,
            phone,
            name: name3,
        })

        await deleteContactDuplicates()

        const deletedDuplicatedContact1 = await Contact.getOne(userClient, {
            id: duplicateContact1.id,
            deletedAt_not: null,
        })
        const deletedDuplicatedContact2 = await Contact.getOne(userClient, {
            id: duplicateContact2.id,
            deletedAt_not: null,
        })
        const notDeletedDuplicatedContact = await Contact.getOne(userClient, {
            id: duplicateContact3.id,
        })

        expect(notDeletedDuplicatedContact.deletedAt).toBeNull()
        expect(deletedDuplicatedContact1).toBeDefined()
        expect(deletedDuplicatedContact2.deletedAt).toBeDefined()
    })

    test('does not delete contacts without duplicates', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const userClient = await makeClientWithProperty()
        const [organization] = await createTestOrganization(adminClient)
        const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, {
            canManageContacts: true,
        })
        await createTestOrganizationEmployee(adminClient, organization, userClient.user, role)

        const unitName = faker.random.alphaNumeric(8)

        const [contact1] = await createTestContact(userClient, organization, userClient.property, {
            unitName,
        })
        const [contact2] = await createTestContact(userClient, organization, userClient.property, {
            unitName,
        })
        const [contact3] = await createTestContact(userClient, organization, userClient.property, {
            unitName,
        })

        await deleteContactDuplicates()

        const deletedDuplicatedContact1 = await Contact.getOne(userClient, {
            id: contact1.id,
        })
        const deletedDuplicatedContact2 = await Contact.getOne(userClient, {
            id: contact2.id,
        })
        const notDeletedDuplicatedContact = await Contact.getOne(userClient, {
            id: contact3.id,
        })

        expect(notDeletedDuplicatedContact.deletedAt).toBeNull()
        expect(deletedDuplicatedContact1.deletedAt).toBeNull()
        expect(deletedDuplicatedContact2.deletedAt).toBeNull()
    })

    test('leaves only contact with tickets if duplicates didn\'t have tickets', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const [organization] = await createTestOrganization(adminClient)
        const [property] = await createTestProperty(adminClient, organization)

        const name1 = faker.random.alphaNumeric(8)
        const name2 = faker.random.alphaNumeric(8)
        const name3 = faker.random.alphaNumeric(8)
        const phone = createTestPhone()
        const unitName = faker.random.alphaNumeric(8)

        const [duplicateContact1] = await createTestContact(adminClient, organization, property, {
            unitName,
            phone,
            name: name1,
        })
        const [contactWithTicket] = await createTestContact(adminClient, organization, property, {
            unitName,
            phone,
            name: name2,
        })
        const [duplicateContact2] = await createTestContact(adminClient, organization, property, {
            unitName,
            phone,
            name: name3,
        })

        await createTestTicket(adminClient, organization, property, {
            contact: { connect: { id: contactWithTicket.id } },
        })

        await deleteContactDuplicates()

        const deletedDuplicatedContact1 = await Contact.getOne(adminClient, {
            id: duplicateContact1.id,
            deletedAt_not: null,
        })
        const deletedDuplicatedContact2 = await Contact.getOne(adminClient, {
            id: duplicateContact2.id,
            deletedAt_not: null,
        })
        const notDeletedDuplicatedContact = await Contact.getOne(adminClient, {
            id: contactWithTicket.id,
        })

        expect(notDeletedDuplicatedContact.deletedAt).toBeNull()
        expect(deletedDuplicatedContact1).toBeDefined()
        expect(deletedDuplicatedContact2.deletedAt).toBeDefined()
    })

    test('leaves only the last created contact with tickets, ' +
        'relinks contacts for tickets with deleted contacts', async () => {
        const adminClient = await makeLoggedInAdminClient()
        const [organization] = await createTestOrganization(adminClient)
        const [property] = await createTestProperty(adminClient, organization)

        const name1 = faker.random.alphaNumeric(8)
        const name2 = faker.random.alphaNumeric(8)
        const name3 = faker.random.alphaNumeric(8)
        const phone = createTestPhone()
        const unitName = faker.random.alphaNumeric(8)

        const [contactWithoutTicket] = await createTestContact(adminClient, organization, property, {
            unitName,
            phone,
            name: name1,
        })
        const [contact1] = await createTestContact(adminClient, organization, property, {
            unitName,
            phone,
            name: name2,
        })
        const [contact2] = await createTestContact(adminClient, organization, property, {
            unitName,
            phone,
            name: name3,
        })

        const [ticket1] = await createTestTicket(adminClient, organization, property, {
            contact: { connect: { id: contact1.id } },
        })

        const [ticket2] = await createTestTicket(adminClient, organization, property, {
            contact: { connect: { id: contact2.id } },
        })

        await deleteContactDuplicates()

        const deletedDuplicatedContact1 = await Contact.getOne(adminClient, {
            id: contactWithoutTicket.id,
            deletedAt_not: null,
        })
        const deletedDuplicatedContact2 = await Contact.getOne(adminClient, {
            id: contact1.id,
            deletedAt_not: null,
        })
        const notDeletedDuplicatedContact = await Contact.getOne(adminClient, {
            id: contact2.id,
        })
        const readTicket1 = await Ticket.getOne(adminClient, {
            id: ticket1.id,
        })
        const readTicket2 = await Ticket.getOne(adminClient, {
            id: ticket2.id,
        })

        expect(notDeletedDuplicatedContact.deletedAt).toBeNull()
        expect(deletedDuplicatedContact1).toBeDefined()
        expect(deletedDuplicatedContact2.deletedAt).toBeDefined()

        expect(readTicket1.contact.id).toEqual(contact2.id)
        expect(readTicket2.contact.id).toEqual(contact2.id)
    })
})