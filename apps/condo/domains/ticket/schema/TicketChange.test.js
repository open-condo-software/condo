/**
 * Generated by `createschema ticket.TicketChange 'ticket:Relationship:Ticket:CASCADE;'`
 */

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    expectToThrowAccessDeniedErrorToObj,
    catchErrorFrom,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowGraphQLRequestError,
    expectToThrowGraphQLRequestErrors,
} = require('@open-condo/keystone/test.utils')
const { makeLoggedInAdminClient, makeClient, DATETIME_RE } = require('@open-condo/keystone/test.utils')
const { i18n } = require('@open-condo/locales/loader')

const { createTestContact } = require('@condo/domains/contact/utils/testSchema')
const { HOLDING_TYPE } = require('@condo/domains/organization/constants/common')
const {
    createTestOrganizationWithAccessToAnotherOrganization,
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
    updateTestOrganizationEmployee,
    createTestOrganizationLink,
} = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithProperty, createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { TicketChange, TicketStatus, TicketSource, createTestTicketChange, updateTestTicketChange } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { STATUS_IDS } = require('../constants/statusTransitions')
const { createTestTicket } = require('../utils/testSchema')
const { updateTestTicket } = require('../utils/testSchema')

describe('TicketChange', () => {
    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Accesses', () => {
        describe('create', () => {
            it('gets created when Ticket has changes in at least one field', async () => {
                const client = await makeClientWithProperty()
                const client2 = await makeClientWithProperty()

                const openedStatus = await TicketStatus.getOne(admin, { id: STATUS_IDS.OPEN })
                const inProgressStatus = await TicketStatus.getOne(admin, { id: STATUS_IDS.IN_PROGRESS })
                const sources = await TicketSource.getAll(admin, {})

                const [contact] = await createTestContact(client, client.organization, client.property)
                const [contact2] = await createTestContact(client, client.organization, client.property)

                const [ticket2] = await createTestTicket(client, client.organization, client.property)
                const [ticket3] = await createTestTicket(client, client.organization, client.property)
                const [ticket] = await createTestTicket(client, client.organization, client.property, {
                    sectionName: faker.lorem.word(),
                    floorName: faker.lorem.word(),
                    unitName: faker.lorem.word(),
                    isEmergency: true,
                    isPayable: true,
                    isWarranty: true,
                    status: { connect: { id: openedStatus.id } },
                    client: { connect: { id: client.user.id } },
                    contact: { connect: { id: contact.id } },
                    assignee: { connect: { id: client.user.id } },
                    executor: { connect: { id: client.user.id } },
                    source: { connect: { id: sources[0].id } },
                    related: { connect: { id: ticket2.id } },
                    // TODO(antonal): figure out how to get old list of related items in many-to-many relationship.
                })

                const payload = {
                    details: faker.lorem.sentence(),
                    statusReason: faker.lorem.sentence(),
                    clientName: faker.name.firstName(),
                    clientEmail: faker.internet.email(),
                    // TODO (SavelevMatthew) Better way to generate phone numbers?
                    clientPhone: faker.phone.number('+79#########'),
                    sectionName: faker.lorem.word(),
                    floorName: faker.lorem.word(),
                    unitName: faker.lorem.word(),
                    isEmergency: false,
                    isWarranty: false,
                    isPayable: false,
                    property: { connect: { id: client2.property.id } },
                    status: { connect: { id: inProgressStatus.id } },
                    client: { connect: { id: client2.user.id } },
                    contact: { connect: { id: contact2.id } },
                    assignee: { connect: { id: client2.user.id } },
                    executor: { connect: { id: client2.user.id } },
                    source: { connect: { id: sources[1].id } },
                    related: { connect: { id: ticket3.id } },
                }

                const [updatedTicket] = await updateTestTicket(admin, ticket.id, payload)

                const ticket1 = await TicketChange.getOne(admin, { ticket: { id: ticket.id } })

                expect(ticket1).toBeDefined()
                expect(ticket1.id).toBeDefined()
                expect(ticket1.v).toEqual(1)
                expect(ticket1.dv).toEqual(1)
                expect(ticket1.sender).toEqual(updatedTicket.sender)
                expect(ticket1.detailsFrom).toEqual(ticket.details)
                expect(ticket1.detailsTo).toEqual(payload.details)
                expect(ticket1.statusReasonFrom).toEqual(ticket.statusReason)
                expect(ticket1.statusReasonTo).toEqual(payload.statusReason)
                expect(ticket1.clientNameFrom).toEqual(ticket.clientName)
                expect(ticket1.clientNameTo).toEqual(payload.clientName)
                expect(ticket1.clientEmailFrom).toEqual(ticket.clientEmail)
                expect(ticket1.clientEmailTo).toEqual(payload.clientEmail)
                expect(ticket1.clientPhoneFrom).toEqual(ticket.clientPhone)
                expect(ticket1.clientPhoneTo).toEqual(payload.clientPhone)
                expect(ticket1.isEmergencyFrom).toEqual(ticket.isEmergency)
                expect(ticket1.isEmergencyTo).toEqual(payload.isEmergency)
                expect(ticket1.isWarrantyFrom).toEqual(ticket.isWarranty)
                expect(ticket1.isWarrantyTo).toEqual(payload.isWarranty)
                expect(ticket1.isPayableFrom).toEqual(ticket.isPayable)
                expect(ticket1.isPayableTo).toEqual(payload.isPayable)
                expect(ticket1.sectionNameFrom).toEqual(ticket.sectionName)
                expect(ticket1.sectionNameTo).toEqual(payload.sectionName)
                expect(ticket1.floorNameFrom).toEqual(ticket.floorName)
                expect(ticket1.floorNameTo).toEqual(payload.floorName)
                expect(ticket1.unitNameFrom).toEqual(ticket.unitName)
                expect(ticket1.unitNameTo).toEqual(payload.unitName)
                expect(ticket1.createdBy).toEqual(expect.objectContaining({ id: admin.user.id }))
                expect(ticket1.updatedBy).toEqual(expect.objectContaining({ id: admin.user.id }))
                expect(ticket1.createdAt).toMatch(DATETIME_RE)
                expect(ticket1.updatedAt).toMatch(DATETIME_RE)

                expect(ticket1.propertyIdFrom).toEqual(ticket.property.id)
                expect(ticket1.propertyIdTo).toEqual(payload.property.connect.id)
                expect(ticket1.propertyDisplayNameFrom).toEqual(client.property.address)
                expect(ticket1.propertyDisplayNameTo).toEqual(client2.property.address)

                expect(ticket1.statusIdFrom).toEqual(ticket.status.id)
                expect(ticket1.statusIdTo).toEqual(payload.status.connect.id)
                expect(ticket1.statusDisplayNameFrom).toEqual(openedStatus.name)
                expect(ticket1.statusDisplayNameTo).toEqual(inProgressStatus.name)

                expect(ticket1.clientIdFrom).toEqual(ticket.client.id)
                expect(ticket1.clientIdTo).toEqual(payload.client.connect.id)
                expect(ticket1.clientDisplayNameFrom).toEqual(client.user.name)
                expect(ticket1.clientDisplayNameTo).toEqual(client2.user.name)

                expect(ticket1.contactIdFrom).toEqual(ticket.contact.id)
                expect(ticket1.contactIdTo).toEqual(payload.contact.connect.id)
                expect(ticket1.contactDisplayNameFrom).toEqual(contact.name)
                expect(ticket1.contactDisplayNameTo).toEqual(contact2.name)

                expect(ticket1.assigneeIdFrom).toEqual(ticket.assignee.id)
                expect(ticket1.assigneeIdTo).toEqual(payload.assignee.connect.id)
                expect(ticket1.assigneeDisplayNameFrom).toEqual(client.user.name)
                expect(ticket1.assigneeDisplayNameTo).toEqual(client2.user.name)

                expect(ticket1.executorIdFrom).toEqual(ticket.executor.id)
                expect(ticket1.executorIdTo).toEqual(payload.executor.connect.id)
                expect(ticket1.executorDisplayNameFrom).toEqual(client.user.name)
                expect(ticket1.executorDisplayNameTo).toEqual(client2.user.name)

                expect(ticket1.sourceIdFrom).toEqual(ticket.source.id)
                expect(ticket1.sourceIdTo).toEqual(payload.source.connect.id)
                expect(ticket1.sourceDisplayNameFrom).toEqual(sources[0].name)
                expect(ticket1.sourceDisplayNameTo).toEqual(sources[1].name)

                expect(ticket1.relatedIdFrom).toEqual(ticket2.id)
                expect(ticket1.relatedIdTo).toEqual(payload.related.connect.id)
                expect(ticket1.relatedDisplayNameFrom).toEqual(ticket2.number.toString())
                expect(ticket1.relatedDisplayNameTo).toEqual(ticket3.number.toString())

                // TODO(antonal): figure out how to get old list of related items in many-to-many relationship.
            })

            it('not gets created when Ticket has no changes', async () => {
                const client = await makeClientWithProperty()
                const [ticket] = await createTestTicket(client, client.organization, client.property)

                const payloadThatChangesNothing = {
                    details: ticket.details,
                    statusReason: ticket.statusReason,
                    clientName: ticket.clientName,
                    property: { connect: { id: client.property.id } },
                }

                await updateTestTicket(admin, ticket.id, payloadThatChangesNothing)

                const objs = await TicketChange.getAll(admin, {
                    ticket: { id: ticket.id },
                })

                expect(objs).toHaveLength(0)
            })

            it('create related fields when Ticket has changes in at least one field from related fields', async () => {
                const client = await makeClientWithProperty()

                const unitName1 = '1' + faker.random.alphaNumeric(5)
                const [ticket] = await createTestTicket(client, client.organization, client.property, { unitName: unitName1 })

                const unitName2 = '2' + faker.random.alphaNumeric(5)
                await updateTestTicket(client, ticket.id, { unitName: unitName2 })

                const [ticketChange] = await TicketChange.getAll(client, {
                    ticket: { id: ticket.id },
                })

                expect(ticketChange.unitNameFrom).toEqual(unitName1)
                expect(ticketChange.unitNameTo).toEqual(unitName2)
                expect(ticketChange.propertyIdFrom).toEqual(client.property.id)
                expect(ticketChange.propertyIdTo).toEqual(client.property.id)
                expect(ticketChange.propertyDisplayNameFrom).toEqual(client.property.address)
                expect(ticketChange.propertyDisplayNameTo).toEqual(client.property.address)
            })
        })

        it('user: create TicketChange', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await createTestTicketChange(client, ticket)
            })
        })

        it('anonymous: create TicketChange', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)
            const anonymous = await makeClient()
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await createTestTicketChange(anonymous, ticket)
            })
        })

        describe('user: read TicketChange', () => {
            it('can read ticket change if user is organization employee with canReadTickets permission', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(admin)
                const [property] = await createTestProperty(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canReadTickets: true })
                await createTestOrganizationEmployee(admin, organization, client.user, role)

                const [ticket] = await createTestTicket(admin, organization, property)

                const payload = {
                    details: faker.lorem.sentence(),
                }

                await updateTestTicket(admin, ticket.id, payload)

                const objs = await TicketChange.getAll(client, {
                    ticket: { id: ticket.id },
                })

                expect(objs).toHaveLength(1)
                expect(objs[0].ticket.id).toEqual(ticket.id)
            })

            it('can not read ticket change if user is organization employee without canReadTickets permission', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(admin)
                const [property] = await createTestProperty(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canReadTickets: false })
                await createTestOrganizationEmployee(admin, organization, client.user, role)

                const [ticket] = await createTestTicket(admin, organization, property)

                const payload = {
                    details: faker.lorem.sentence(),
                }

                await updateTestTicket(admin, ticket.id, payload)

                const objs = await TicketChange.getAll(client, {
                    ticket: { id: ticket.id },
                })

                expect(objs).toHaveLength(0)
            })
        })

        it('anonymous: read TicketChange', async () => {
            const anonymous = await makeClient()
            await expectToThrowAuthenticationErrorToObjects(async () => {
                await TicketChange.getAll(anonymous)
            })
        })

        it('user: update TicketChange', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(admin, client.organization, client.property)

            const payload = {
                details: faker.lorem.sentence(),
            }

            await updateTestTicket(admin, ticket.id, payload)

            const [objCreated] = await TicketChange.getAll(admin, {
                ticket: { id: ticket.id },
            })

            await expectToThrowGraphQLRequestErrors(
                async () => await updateTestTicketChange(client, objCreated.id),
                ['Unknown type "TicketChangeUpdateInput"', 'Cannot query field "updateTicketChange" on type "Mutation"'],
            )
        })

        it('anonymous: update TicketChange', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(admin, client.organization, client.property)
            const anonymous = await makeClient()

            const payload = {
                details: faker.lorem.sentence(),
            }

            await updateTestTicket(admin, ticket.id, payload)

            const [objCreated] = await TicketChange.getAll(admin, {
                ticket: { id: ticket.id },
            })

            await catchErrorFrom(async () => {
                await updateTestTicketChange(anonymous, objCreated.id)
            }, ({ errors }) => {
                // Custom match should be used here, because error message contains
                // suggestions, like "Did you mean …", that cannot be known in advance
                // So, just inspect basic part of the message
                expect(errors).toHaveLength(2)
                expect(errors[0].message).toMatch('Unknown type "TicketChangeUpdateInput"')
                expect(errors[1].message).toMatch('Cannot query field "updateTicketChange" on type "Mutation"')
            })
        })

        it('user: delete TicketChange', async () => {
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(admin, client.organization, client.property)

            const payload = {
                details: faker.lorem.sentence(),
            }

            await updateTestTicket(admin, ticket.id, payload)

            const [objCreated] = await TicketChange.getAll(admin, {
                ticket: { id: ticket.id },
            })

            await expectToThrowGraphQLRequestError(
                async () => { await TicketChange.delete(client, objCreated.id) },
                'Cannot query field "deleteTicketChange" on type "Mutation"',
            )
        })

        it('anonymous: delete TicketChange', async () => {
            const client = await makeClientWithProperty()
            const anonymous = await makeClient()
            const [ticket] = await createTestTicket(admin, client.organization, client.property)

            const payload = {
                details: faker.lorem.sentence(),
            }

            await updateTestTicket(admin, ticket.id, payload)

            const [objCreated] = await TicketChange.getAll(admin, {
                ticket: { id: ticket.id },
            })

            await expectToThrowGraphQLRequestError(
                async () => await TicketChange.delete(anonymous, objCreated.id),
                'Cannot query field "deleteTicketChange" on type "Mutation"',
            )
        })

        it('employee from "from" relation: can read ticket changes from his "to" relation organization', async () => {
            const { clientFrom, organizationTo, propertyTo } = await createTestOrganizationWithAccessToAnotherOrganization()
            const [ticket] = await createTestTicket(admin, organizationTo, propertyTo)
            const payload = {
                details: faker.lorem.sentence(),
            }
            await updateTestTicket(admin, ticket.id, payload)

            const objs = await TicketChange.getAll(clientFrom, {
                ticket: { id: ticket.id },
            })
            expect(objs).toHaveLength(1)
            expect(objs[0].ticket.id).toEqual(ticket.id)
        })

        it('employee from "to" relation: cannot read ticket changes from his "from" relation organization', async () => {
            const { organizationFrom, propertyFrom, clientTo } = await createTestOrganizationWithAccessToAnotherOrganization()
            const [ticket] = await createTestTicket(admin, organizationFrom, propertyFrom)
            const payload = {
                details: faker.lorem.sentence(),
            }
            await updateTestTicket(admin, ticket.id, payload)

            const objs = await TicketChange.getAll(clientTo, {
                ticket: { id: ticket.id },
            })
            expect(objs).toHaveLength(0)
        })
    })

    describe('Fields logic', () => {
        describe('changedByRole', () => {
            it('ticket changed by organization employee', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(admin)
                const [property] = await createTestProperty(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canManageTickets: true })
                await createTestOrganizationEmployee(admin, organization, client.user, role)

                const [ticket] = await createTestTicket(client, organization, property)
                const payload = {
                    details: faker.lorem.sentence(),
                }
                await updateTestTicket(client, ticket.id, payload)

                const obj = await TicketChange.getOne(client, {
                    ticket: { id: ticket.id },
                })
                expect(obj.changedByRole).toEqual(i18n(role.name))
            })

            it('ticket changed by related from organization employee', async () => {
                const { clientFrom, organizationTo, propertyTo, roleFrom } = await createTestOrganizationWithAccessToAnotherOrganization({
                    roleExtraAttrs: { canManageTickets: true },
                })
                const [ticket] = await createTestTicket(clientFrom, organizationTo, propertyTo)
                const payload = {
                    details: faker.lorem.sentence(),
                }
                await updateTestTicket(clientFrom, ticket.id, payload)

                const obj = await TicketChange.getOne(clientFrom, {
                    ticket: { id: ticket.id },
                })
                expect(obj.changedByRole).toEqual(i18n(roleFrom.name))
            })

            it('ticket changed by deleted organization employee', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(admin)
                const [property] = await createTestProperty(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canManageTickets: true })
                const [employee] = await createTestOrganizationEmployee(admin, organization, client.user, role)

                const [ticket] = await createTestTicket(client, organization, property)
                const payload = {
                    details: faker.lorem.sentence(),
                }
                await updateTestTicket(client, ticket.id, payload)

                await updateTestOrganizationEmployee(admin, employee.id, {
                    deletedAt: dayjs().toISOString(),
                })

                const obj = await TicketChange.getOne(admin, {
                    ticket: { id: ticket.id },
                })
                expect(obj.changedByRole).toEqual(i18n('DeletedEmployee'))
            })

            it('ticket changed by user with deleted organization employee and existing related from organization employee', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [organizationFrom] = await createTestOrganization(admin, { type: HOLDING_TYPE })
                const [roleFrom] = await createTestOrganizationEmployeeRole(admin, organizationFrom, { canManageTickets: true })
                await createTestOrganizationEmployee(admin, organizationFrom, client.user, roleFrom)

                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canManageTickets: true })
                const [property] = await createTestProperty(admin, organization)
                const [employee] = await createTestOrganizationEmployee(admin, organization, client.user, role)

                await createTestOrganizationLink(admin, organizationFrom, organization)

                const [ticket] = await createTestTicket(client, organization, property)
                const payload = {
                    details: faker.lorem.sentence(),
                }
                await updateTestTicket(client, ticket.id, payload)

                await updateTestOrganizationEmployee(admin, employee.id, {
                    deletedAt: dayjs().toISOString(),
                })

                const obj = await TicketChange.getOne(admin, {
                    ticket: { id: ticket.id },
                })
                expect(obj.changedByRole).toEqual(i18n(roleFrom.name))
            })

            it('ticket changed by user with deleted related from organization employee and existing organization employee', async () => {
                const { clientFrom, employeeFrom } = await createTestOrganizationWithAccessToAnotherOrganization({
                    roleExtraAttrs: { canManageTickets: true },
                })
                const [organization] = await createTestOrganization(admin)
                const [property] = await createTestProperty(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canManageTickets: true })
                await createTestOrganizationEmployee(admin, organization, clientFrom.user, role)

                const [ticket] = await createTestTicket(clientFrom, organization, property)
                const payload = {
                    details: faker.lorem.sentence(),
                }
                await updateTestTicket(clientFrom, ticket.id, payload)

                await updateTestOrganizationEmployee(admin, employeeFrom.id, {
                    deletedAt: dayjs().toISOString(),
                })

                const obj = await TicketChange.getOne(admin, {
                    ticket: { id: ticket.id },
                })
                expect(obj.changedByRole).toEqual(i18n(role.name))
            })
        })

        describe('actualCreationDate', () => {
            it('is filled if statusUpdatedAt difference from now more than 10 sec', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(admin)
                const [property] = await createTestProperty(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canManageTickets: true })
                await createTestOrganizationEmployee(admin, organization, client.user, role)

                const [ticket] = await createTestTicket(client, organization, property)
                const statusUpdatedAt = dayjs().subtract('20', 'second').toISOString()

                const payload = {
                    status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
                    statusUpdatedAt,
                }
                await updateTestTicket(client, ticket.id, payload)

                const obj = await TicketChange.getOne(client, {
                    ticket: { id: ticket.id },
                })

                expect(obj.actualCreationDate).toEqual(statusUpdatedAt)
            })

            it('is not filled if statusUpdatedAt difference from now less than 10 sec', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(admin)
                const [property] = await createTestProperty(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canManageTickets: true })
                await createTestOrganizationEmployee(admin, organization, client.user, role)

                const [ticket] = await createTestTicket(client, organization, property)
                const statusUpdatedAt = dayjs().subtract('1', 'second').toISOString()

                const payload = {
                    status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
                    statusUpdatedAt,
                }
                await updateTestTicket(client, ticket.id, payload)

                const obj = await TicketChange.getOne(client, {
                    ticket: { id: ticket.id },
                })

                expect(new Date(obj.actualCreationDate).getTime()).toBeGreaterThan(new Date(statusUpdatedAt).getTime())
            })

            it('is not filled if statusUpdatedAt is not in the payload', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const [organization] = await createTestOrganization(admin)
                const [property] = await createTestProperty(admin, organization)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canManageTickets: true })
                await createTestOrganizationEmployee(admin, organization, client.user, role)

                const [ticket] = await createTestTicket(client, organization, property)
                const statusUpdatedAt = dayjs().subtract('20', 'second').toISOString()

                // Update 1 Update status explicitly. TicketChange actualUpdateDate should equal this number
                await updateTestTicket(client, ticket.id, {
                    status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
                    statusUpdatedAt,
                })

                // Explicitly sleep for some time
                await new Promise(r => setTimeout(r, 500))

                // Update 2 Update anything but the status. TicketChange actualUpdateDate should be GT StatusUpdatedAt
                await updateTestTicket(client, ticket.id, { details: 'o tempora o mores!' })

                const objs = await TicketChange.getAll(client,
                    { ticket: { id: ticket.id } },
                    { sortBy: 'actualCreationDate_ASC' },
                )

                const statusUpdatedAtDate = new Date(statusUpdatedAt)
                const date1 = new Date(objs[0].actualCreationDate)
                const date2 = new Date(objs[1].actualCreationDate)

                expect(date1.getTime()).toEqual(statusUpdatedAtDate.getTime())
                expect(date2.getTime()).toBeGreaterThan(statusUpdatedAtDate.getTime())
            })
        })
    })
})
