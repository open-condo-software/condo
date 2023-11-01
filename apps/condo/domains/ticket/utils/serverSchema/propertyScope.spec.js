/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { ORGANIZATION_TICKET_VISIBILITY, PROPERTY_TICKET_VISIBILITY, PROPERTY_AND_SPECIALIZATION_VISIBILITY, ASSIGNED_TICKET_VISIBILITY } = require('@condo/domains/organization/constants/common')
const { OrganizationEmployeeSpecialization } = require('@condo/domains/organization/utils/testSchema')
const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee, createTestOrganizationEmployeeSpecialization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { PropertyScope } = require('@condo/domains/scope/utils/testSchema')
const { createTestPropertyScope, createTestPropertyScopeOrganizationEmployee, createTestPropertyScopeProperty } = require('@condo/domains/scope/utils/testSchema')
const { createTestTicket, createTestTicketClassifier } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { getUsersAvailableToReadTicketByPropertyScope } = require('./propertyScope')


describe('propertyScope ticket helpers', () => {
    setFakeClientMode(index)

    let admin,
        organization,
        employeeUserWithOrganizationTicketVisibility,
        employeeUserWithPropertyTicketVisibility,
        employeeUserWithPropertyAndSpecializationTicketVisibility,
        employeeUserWithAssignedTicketVisibility,
        employeeWithOrganizationTicketVisibility,
        employeeWithPropertyTicketVisibility,
        employeeWithPropertyAndSpecializationTicketVisibility,
        employeeWithAssignedTicketVisibility

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const [testOrganization] = await createTestOrganization(admin)
        organization = testOrganization

        const [organizationVisibilityRole] = await createTestOrganizationEmployeeRole(admin, organization, {
            ticketVisibilityType: ORGANIZATION_TICKET_VISIBILITY,
        })
        const [propertyVisibilityRole] = await createTestOrganizationEmployeeRole(admin, organization, {
            ticketVisibilityType: PROPERTY_TICKET_VISIBILITY,
        })
        const [propertyAndSpecializationVisibilityRole] = await createTestOrganizationEmployeeRole(admin, organization, {
            ticketVisibilityType: PROPERTY_AND_SPECIALIZATION_VISIBILITY,
        })
        const [assignedVisibilityRole] = await createTestOrganizationEmployeeRole(admin, organization, {
            ticketVisibilityType: ASSIGNED_TICKET_VISIBILITY,
        })

        employeeUserWithOrganizationTicketVisibility = await makeClientWithNewRegisteredAndLoggedInUser()
        employeeUserWithPropertyTicketVisibility = await makeClientWithNewRegisteredAndLoggedInUser()
        employeeUserWithPropertyAndSpecializationTicketVisibility = await makeClientWithNewRegisteredAndLoggedInUser()
        employeeUserWithAssignedTicketVisibility = await makeClientWithNewRegisteredAndLoggedInUser()

        const activeEmployeeData = {
            isRejected: false,
            isAccepted: true,
            isBlocked: false,
        }

        const [tempEmployee1] = await createTestOrganizationEmployee(admin, organization, employeeUserWithOrganizationTicketVisibility.user, organizationVisibilityRole, activeEmployeeData)
        employeeWithOrganizationTicketVisibility = tempEmployee1
        const [tempEmployee2] =  await createTestOrganizationEmployee(admin, organization, employeeUserWithPropertyTicketVisibility.user, propertyVisibilityRole, activeEmployeeData)
        employeeWithPropertyTicketVisibility = tempEmployee2
        const [tempEmployee3] = await createTestOrganizationEmployee(admin, organization, employeeUserWithPropertyAndSpecializationTicketVisibility.user, propertyAndSpecializationVisibilityRole, activeEmployeeData)
        employeeWithPropertyAndSpecializationTicketVisibility = tempEmployee3
        const [tempEmployee4] = await createTestOrganizationEmployee(admin, organization, employeeUserWithAssignedTicketVisibility.user, assignedVisibilityRole, activeEmployeeData)
        employeeWithAssignedTicketVisibility = tempEmployee4
    })

    afterEach(async () => {
        const scopesToDelete = await PropertyScope.getAll(admin, {
            organization: { id: organization.id },
            deletedAt: null,
        })

        for (const scope of scopesToDelete) {
            await PropertyScope.softDelete(admin, scope.id)
        }

        const specializationsToDelete = await OrganizationEmployeeSpecialization.getAll(admin, {
            employee: { id: employeeWithPropertyAndSpecializationTicketVisibility.id },
            deletedAt: null,
        })

        for (const spec of specializationsToDelete) {
            await OrganizationEmployeeSpecialization.softDelete(admin, spec.id)
        }
    })

    describe('getUsersAvailableToReadTicketByPropertyScope', () => {
        describe('organization ticket visibility', () => {
            it('can read tickets in organization where user is employee', async () => {
                const [property] = await createTestProperty(admin, organization)
                const [ticket] = await createTestTicket(admin, organization, property)

                const users = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: ticket.organization.id,
                    ticketPropertyId: ticket.property.id,
                })

                expect(users).toHaveLength(1)
                expect(users[0]).toEqual(employeeUserWithOrganizationTicketVisibility.user.id)
            })

            it('cannot read tickets in organization where user is not employee', async () => {
                const [organization1] = await createTestOrganization(admin)

                const [property] = await createTestProperty(admin, organization1)
                const [ticket] = await createTestTicket(admin, organization1, property)

                const users = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: ticket.organization.id,
                    ticketPropertyId: ticket.property.id,
                })

                expect(users).toHaveLength(0)
            })
        })

        describe('property ticket visibility', () => {
            it('can read all tickets in organization if employee in PropertyScope with hasAllProperties flag', async () => {
                const [property] = await createTestProperty(admin, organization)

                const [propertyScope] = await createTestPropertyScope(admin, organization, {
                    hasAllProperties: true,
                })
                await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employeeWithPropertyTicketVisibility)

                const users = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                })

                expect(users).toHaveLength(2)
                expect(users).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users).toContain(employeeUserWithPropertyTicketVisibility.user.id)
            })

            it('can read tickets in properties from PropertyScope where this employee is', async () => {
                const [property] = await createTestProperty(admin, organization)
                const [property2] = await createTestProperty(admin, organization)

                const [propertyScope] = await createTestPropertyScope(admin, organization)
                await createTestPropertyScopeProperty(admin, propertyScope, property)
                await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employeeWithPropertyTicketVisibility)

                const availableToReadTicketInScopeUsers = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                })

                expect(availableToReadTicketInScopeUsers).toHaveLength(2)
                expect(availableToReadTicketInScopeUsers).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(availableToReadTicketInScopeUsers).toContain(employeeUserWithPropertyTicketVisibility.user.id)

                const availableToReadTicketOutOfScopeUsers = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property2.id,
                })

                expect(availableToReadTicketOutOfScopeUsers).toHaveLength(1)
                expect(availableToReadTicketOutOfScopeUsers).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
            })

            it('can read tickets where employee is executor or assignee', async () => {
                const [property] = await createTestProperty(admin, organization)

                const users = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketExecutorId: employeeUserWithPropertyTicketVisibility.user.id,
                    ticketAssigneeId: employeeUserWithPropertyTicketVisibility.user.id,
                })

                expect(users).toHaveLength(2)
                expect(users).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users).toContain(employeeUserWithPropertyTicketVisibility.user.id)
            })

            it('cannot read tickets with properties which are in the PropertyScope where employee is not', async () => {
                const [property] = await createTestProperty(admin, organization)

                const [propertyScope] = await createTestPropertyScope(admin, organization)
                await createTestPropertyScopeProperty(admin, propertyScope, property)

                const users = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                })

                expect(users).toHaveLength(1)
                expect(users[0]).toEqual(employeeUserWithOrganizationTicketVisibility.user.id)
            })
        })

        describe('property and specialization ticket visibility', () => {
            it('can read tickets with TicketCategoryClassifier matches to employee OrganizationEmployeeSpecialization ' +
                'and property from PropertyScope where this employee is', async () => {
                const [classifier1] = await createTestTicketClassifier(admin)
                const [classifier2] = await createTestTicketClassifier(admin)

                const [property] = await createTestProperty(admin, organization)
                const [property2] = await createTestProperty(admin, organization)

                const [propertyScope] = await createTestPropertyScope(admin, organization)
                await createTestPropertyScopeProperty(admin, propertyScope, property)
                await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employeeWithPropertyAndSpecializationTicketVisibility)
                await createTestOrganizationEmployeeSpecialization(admin, employeeWithPropertyAndSpecializationTicketVisibility, classifier1.category)

                const users1 = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketCategoryClassifierId: classifier1.category.id,
                })

                expect(users1).toHaveLength(2)
                expect(users1).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users1).toContain(employeeWithPropertyAndSpecializationTicketVisibility.user.id)

                const users2 = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketCategoryClassifierId: classifier2.category.id,
                })

                expect(users2).toHaveLength(1)
                expect(users2).toContain(employeeUserWithOrganizationTicketVisibility.user.id)

                const users3 = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property2.id,
                    ticketCategoryClassifierId: classifier1.category.id,
                })

                expect(users3).toHaveLength(1)
                expect(users3).toContain(employeeUserWithOrganizationTicketVisibility.user.id)

                const users4 = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property2.id,
                    ticketCategoryClassifierId: classifier2.category.id,
                })

                expect(users4).toHaveLength(1)
                expect(users4).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
            })
        })

        describe('assigned ticket visibility', () => {
            it('can read only tickets where employee is executor or assignee', async () => {
                const [property] = await createTestProperty(admin, organization)

                const users1 = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketAssigneeId: employeeUserWithAssignedTicketVisibility.user.id,
                })

                expect(users1).toHaveLength(2)
                expect(users1).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users1).toContain(employeeUserWithAssignedTicketVisibility.user.id)

                const users2 = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketExecutorId: employeeUserWithAssignedTicketVisibility.user.id,
                })

                expect(users2).toHaveLength(2)
                expect(users2).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users2).toContain(employeeUserWithAssignedTicketVisibility.user.id)

                const users3 = await getUsersAvailableToReadTicketByPropertyScope({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                })

                expect(users3).toHaveLength(1)
                expect(users3).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
            })
        })
    })
})