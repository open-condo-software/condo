/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { ORGANIZATION_TICKET_VISIBILITY, PROPERTY_TICKET_VISIBILITY, PROPERTY_AND_SPECIALIZATION_VISIBILITY, ASSIGNED_TICKET_VISIBILITY, HOLDING_TYPE } = require('@condo/domains/organization/constants/common')
const { OrganizationEmployeeSpecialization, createTestOrganizationLink } = require('@condo/domains/organization/utils/testSchema')
const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee, createTestOrganizationEmployeeSpecialization } = require('@condo/domains/organization/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { PropertyScope } = require('@condo/domains/scope/utils/testSchema')
const { createTestPropertyScope, createTestPropertyScopeOrganizationEmployee, createTestPropertyScopeProperty } = require('@condo/domains/scope/utils/testSchema')
const { createTestTicket, createTestTicketClassifier } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { getUsersToSendTicketRelatedNotifications } = require('./notification')


describe('getUsersToSendTicketRelatedNotifications', () => {
    setFakeClientMode(index)

    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Organization employees with different ticket visibility types', () => {
        let organization,
            employeeUserWithOrganizationTicketVisibility,
            employeeUserWithPropertyTicketVisibility,
            employeeUserWithPropertyAndSpecializationTicketVisibility,
            employeeUserWithAssignedTicketVisibility,
            employeeWithPropertyTicketVisibility,
            employeeWithPropertyAndSpecializationTicketVisibility

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

            await createTestOrganizationEmployee(admin, organization, employeeUserWithOrganizationTicketVisibility.user, organizationVisibilityRole, activeEmployeeData)
            const [tempEmployee2] = await createTestOrganizationEmployee(admin, organization, employeeUserWithPropertyTicketVisibility.user, propertyVisibilityRole, activeEmployeeData)
            employeeWithPropertyTicketVisibility = tempEmployee2
            const [tempEmployee3] = await createTestOrganizationEmployee(admin, organization, employeeUserWithPropertyAndSpecializationTicketVisibility.user, propertyAndSpecializationVisibilityRole, activeEmployeeData)
            employeeWithPropertyAndSpecializationTicketVisibility = tempEmployee3
            await createTestOrganizationEmployee(admin, organization, employeeUserWithAssignedTicketVisibility.user, assignedVisibilityRole, activeEmployeeData)
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

        describe('Organization ticket visibility', () => {
            test('Returns user with organization ticket visibility if he is an employee', async () => {
                const [property] = await createTestProperty(admin, organization)
                const [ticket] = await createTestTicket(admin, organization, property)

                const users = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: ticket.organization.id,
                    ticketPropertyId: ticket.property.id,
                })

                expect(users).toHaveLength(1)
                expect(users[0]).toEqual(employeeUserWithOrganizationTicketVisibility.user.id)
            })

            test('Does not not return user with organization ticket visibility if he is not an employee', async () => {
                const [organization1] = await createTestOrganization(admin)

                const [property] = await createTestProperty(admin, organization1)
                const [ticket] = await createTestTicket(admin, organization1, property)

                const users = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: ticket.organization.id,
                    ticketPropertyId: ticket.property.id,
                })

                expect(users).toHaveLength(0)
            })
        })

        describe('Property ticket visibility', () => {
            test('Returns users with property ticket visibility who includes in property scope with hasAllProperties flag', async () => {
                const [property] = await createTestProperty(admin, organization)

                const [propertyScope] = await createTestPropertyScope(admin, organization, {
                    hasAllProperties: true,
                })
                await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employeeWithPropertyTicketVisibility)

                const users = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                })

                expect(users).toHaveLength(2)
                expect(users).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users).toContain(employeeUserWithPropertyTicketVisibility.user.id)
            })

            test('Returns users with property ticket visibility who includes in property scope with ticket property', async () => {
                const [property] = await createTestProperty(admin, organization)
                const [property2] = await createTestProperty(admin, organization)

                const [propertyScope] = await createTestPropertyScope(admin, organization)
                await createTestPropertyScopeProperty(admin, propertyScope, property)
                await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employeeWithPropertyTicketVisibility)

                const availableToReadTicketInScopeUsers = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                })

                expect(availableToReadTicketInScopeUsers).toHaveLength(2)
                expect(availableToReadTicketInScopeUsers).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(availableToReadTicketInScopeUsers).toContain(employeeUserWithPropertyTicketVisibility.user.id)

                const availableToReadTicketOutOfScopeUsers = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property2.id,
                })

                expect(availableToReadTicketOutOfScopeUsers).toHaveLength(1)
                expect(availableToReadTicketOutOfScopeUsers).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
            })

            test('Returns users if they are assignee or executor in ticket', async () => {
                const [property] = await createTestProperty(admin, organization)

                const users = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketExecutorId: employeeUserWithPropertyTicketVisibility.user.id,
                    ticketAssigneeId: employeeUserWithPropertyTicketVisibility.user.id,
                })

                expect(users).toHaveLength(2)
                expect(users).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users).toContain(employeeUserWithPropertyTicketVisibility.user.id)
            })

            test('Does not return user with property ticket visibility if he is not in property scope', async () => {
                const [property] = await createTestProperty(admin, organization)

                const [propertyScope] = await createTestPropertyScope(admin, organization)
                await createTestPropertyScopeProperty(admin, propertyScope, property)

                const users = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                })

                expect(users).toHaveLength(1)
                expect(users[0]).toEqual(employeeUserWithOrganizationTicketVisibility.user.id)
            })
        })

        describe('Property and specialization ticket visibility', () => {
            test('Return user with if his specialization matches with ticket category classifier ' +
                'and user includes in property scope with ticket property', async () => {
                const [classifier1] = await createTestTicketClassifier(admin)
                const [classifier2] = await createTestTicketClassifier(admin)

                const [property] = await createTestProperty(admin, organization)
                const [property2] = await createTestProperty(admin, organization)

                const [propertyScope] = await createTestPropertyScope(admin, organization)
                await createTestPropertyScopeProperty(admin, propertyScope, property)
                await createTestPropertyScopeOrganizationEmployee(admin, propertyScope, employeeWithPropertyAndSpecializationTicketVisibility)
                await createTestOrganizationEmployeeSpecialization(admin, employeeWithPropertyAndSpecializationTicketVisibility, classifier1.category)

                const users1 = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketCategoryClassifierId: classifier1.category.id,
                })

                expect(users1).toHaveLength(2)
                expect(users1).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users1).toContain(employeeWithPropertyAndSpecializationTicketVisibility.user.id)

                const users2 = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketCategoryClassifierId: classifier2.category.id,
                })

                expect(users2).toHaveLength(1)
                expect(users2).toContain(employeeUserWithOrganizationTicketVisibility.user.id)

                const users3 = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property2.id,
                    ticketCategoryClassifierId: classifier1.category.id,
                })

                expect(users3).toHaveLength(1)
                expect(users3).toContain(employeeUserWithOrganizationTicketVisibility.user.id)

                const users4 = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property2.id,
                    ticketCategoryClassifierId: classifier2.category.id,
                })

                expect(users4).toHaveLength(1)
                expect(users4).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
            })
        })

        describe('Assigned ticket visibility', () => {
            test('Returns user if he is ticket assignee or executor', async () => {
                const [property] = await createTestProperty(admin, organization)

                const users1 = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketAssigneeId: employeeUserWithAssignedTicketVisibility.user.id,
                })

                expect(users1).toHaveLength(2)
                expect(users1).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users1).toContain(employeeUserWithAssignedTicketVisibility.user.id)

                const users2 = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                    ticketExecutorId: employeeUserWithAssignedTicketVisibility.user.id,
                })

                expect(users2).toHaveLength(2)
                expect(users2).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
                expect(users2).toContain(employeeUserWithAssignedTicketVisibility.user.id)

                const users3 = await getUsersToSendTicketRelatedNotifications({
                    ticketOrganizationId: organization.id,
                    ticketPropertyId: property.id,
                })

                expect(users3).toHaveLength(1)
                expect(users3).toContain(employeeUserWithOrganizationTicketVisibility.user.id)
            })
        })
    })

    describe('Related organization employees', () => {
        test('Returns users who are employee in ticket related organization', async () => {
            const organizationEmployeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(organizationEmployeeUser)
            const [property] = await createTestProperty(organizationEmployeeUser, organization)
            const relatedOrganizationEmployeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
            const [relatedOrganization] = await registerNewOrganization(relatedOrganizationEmployeeUser, {
                type: HOLDING_TYPE,
            })

            await createTestOrganizationLink(admin, relatedOrganization, organization)

            const users = await getUsersToSendTicketRelatedNotifications({
                ticketOrganizationId: organization.id,
                ticketPropertyId: property.id,
            })

            expect(users).toHaveLength(2)
            expect(users).toEqual(
                expect.arrayContaining([
                    organizationEmployeeUser.user.id,
                    relatedOrganizationEmployeeUser.user.id,
                ])
            )
        })

        test('Does not return users who are not an employee in ticket related organization', async () => {
            const organizationEmployeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await registerNewOrganization(organizationEmployeeUser)
            const [property] = await createTestProperty(organizationEmployeeUser, organization)
            const [otherOrganization] = await registerNewOrganization(organizationEmployeeUser)
            const relatedOrganizationEmployeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
            const [relatedToOtherOrganization] = await registerNewOrganization(relatedOrganizationEmployeeUser, {
                type: HOLDING_TYPE,
            })

            await createTestOrganizationLink(admin, relatedToOtherOrganization, otherOrganization)

            const users = await getUsersToSendTicketRelatedNotifications({
                ticketOrganizationId: organization.id,
                ticketPropertyId: property.id,
            })

            expect(users).toHaveLength(1)
            expect(users).toEqual(
                expect.arrayContaining([
                    organizationEmployeeUser.user.id,
                ])
            )
        })
    })
})