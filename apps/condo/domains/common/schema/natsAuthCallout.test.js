const { faker } = require('@faker-js/faker')

const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { configure, checkNatsAccess, getAvailableStreams } = require('@open-condo/nats')

const { getEmployedOrRelatedOrganizationsByPermissions } = require('@condo/domains/organization/utils/accessSchema')
const { createTestOrganization, createTestOrganizationEmployee, createTestOrganizationEmployeeRole } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { Ticket, createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { streamRegistry } = require('../../../natsStreams')

describe('NATS Access Control', () => {
    let admin

    beforeAll(async () => {
        configure({
            getPermittedOrganizations: getEmployedOrRelatedOrganizationsByPermissions,
        })

        admin = await makeLoggedInAdminClient()
    })
    describe('checkNatsAccess', () => {
        describe('Boolean true access (public)', () => {
            beforeAll(() => {
                streamRegistry.register('test-public-events', {
                    ttl: 3600,
                    subjects: ['test-public-events.>'],
                    access: {
                        read: true,
                    },
                })
            })

            it('allows authenticated user to access public stream', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const userId = client.user.id
                const [organization] = await createTestOrganization(admin)
                const organizationId = organization.id

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkNatsAccess(
                    context,
                    userId,
                    organizationId,
                    'test-public-events.test.message'
                )

                expect(result.allowed).toBe(true)
            })
        })

        describe('Permission string access', () => {
            beforeAll(() => {
                streamRegistry.register('test-permission-changes', {
                    ttl: 3600,
                    subjects: ['test-permission-changes.>'],
                    access: {
                        read: 'canManageTickets',
                    },
                })
            })

            it('allows user with required permission', async () => {
                const [organization] = await createTestOrganization(admin)
                const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canReadTickets: true, canManageTickets: true } )
                const employeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
                await createTestOrganizationEmployee(admin, organization, employeeUser.user, role, {
                    isRejected: false,
                    isAccepted: true,
                    isBlocked: false,
                })

                const userId = employeeUser.user.id
                const organizationId = organization.id

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkNatsAccess(
                    context,
                    userId,
                    organizationId,
                    'test-permission-changes.test.message'
                )

                expect(result.allowed).toBeTruthy()
                expect(result.user).toEqual(userId)
                expect(result.organization).toEqual(organizationId)
            })

            it('denies user without required permission', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const userId = client.user.id

                const [organization] = await createTestOrganization(admin)
                const organizationId = organization.id

                const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                    canManageTickets: false,
                })

                await createTestOrganizationEmployee(admin, organization, client.user, role, {
                    isAccepted: true,
                    isRejected: false,
                })

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkNatsAccess(
                    context,
                    userId,
                    organizationId,
                    'test-permission-changes.test.message'
                )

                expect(result.allowed).toBe(false)
                expect(result.reason).toBe('Permission denied')
            })

        })

        describe('Custom function access', () => {
            beforeAll(() => {
                streamRegistry.register('test-custom-events', {
                    ttl: 3600,
                    subjects: ['test-custom-events.>'],
                    access: {
                        read: async ({ authentication, context, organizationId, subject }) => {
                            try {
                                const { item: user } = authentication
                                if (!user || user.deletedAt) return false

                                const ticketId = subject.split('.')[2]
                                if (!ticketId) return false

                                const ticket = await Ticket.getOne(context, {
                                    id: ticketId,
                                    organization: { id: organizationId },
                                })

                                if (!ticket) return false

                                const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(context, user, ['canReadTickets'])
                                return permittedOrganizations.includes(organizationId)
                            } catch (error) {
                                return false
                            }
                        },
                    },
                })
            })

            it('denies user who cannot access ticket from different organization', async () => {
                const client1 = await makeClientWithProperty()
                const client2 = await makeClientWithProperty()

                const [ticket] = await createTestTicket(client1, client1.organization, client1.property)
                const ticketId = ticket.id

                const userId = client2.user.id
                const organizationId = client2.organization.id

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkNatsAccess(
                    context,
                    userId,
                    organizationId,
                    `test-custom-events.${organizationId}.${ticketId}`
                )

                expect(result.allowed).toBe(false)
                expect(result.reason).toBe('Access denied by custom function')
            })

            it('denies access when ticket does not exist', async () => {
                const client = await makeClientWithProperty()
                const userId = client.user.id
                const organizationId = client.organization.id
                const fakeTicketId = faker.datatype.uuid()

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkNatsAccess(
                    context,
                    userId,
                    organizationId,
                    `test-custom-events.${organizationId}.${fakeTicketId}`
                )

                expect(result.allowed).toBe(false)
                expect(result.reason).toBe('Access denied by custom function')
            })
        })

        describe('Error handling', () => {
            it('denies access for non-existent stream', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const userId = client.user.id
                const [organization] = await createTestOrganization(admin)
                const organizationId = organization.id

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkNatsAccess(
                    context,
                    userId,
                    organizationId,
                    'non-existent-stream.test.message'
                )

                expect(result.allowed).toBe(false)
                expect(result.reason).toBe('Stream not found')
            })

            it('denies access when stream has no access config', async () => {
                streamRegistry.register('test-no-access-events', {
                    ttl: 3600,
                    subjects: ['test-no-access-events.>'],
                })

                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const userId = client.user.id
                const [organization] = await createTestOrganization(admin)
                const organizationId = organization.id

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkNatsAccess(
                    context,
                    userId,
                    organizationId,
                    'test-no-access-events.test.message'
                )

                expect(result.allowed).toBe(false)
                expect(result.reason).toBe('No access configuration for stream')
            })
        })
    })

    describe('getAvailableStreams', () => {
        beforeAll(() => {
            streamRegistry.register('test-available-public-events', {
                ttl: 3600,
                subjects: ['test-available-public-events.>'],
                access: {
                    read: true,
                },
            })

            streamRegistry.register('test-available-permission-changes', {
                ttl: 3600,
                subjects: ['test-available-permission-changes.>'],
                access: {
                    read: 'canManageTickets',
                },
            })

            streamRegistry.register('test-available-custom-events', {
                ttl: 3600,
                subjects: ['test-available-custom-events.>'],
                access: {
                    read: async ({ authentication, context }) => {
                        const { item: user } = authentication
                        if (!user || user.deletedAt) return false
                        const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(context, user, ['canManageTickets'])
                        return permittedOrganizations.length > 0
                    },
                },
            })
        })

        it('returns only public and permitted streams for regular user', async () => {
            const client = await makeClientWithProperty()
            const userId = client.user.id
            const organizationId = client.organization.id

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const streams = await getAvailableStreams(context, userId, organizationId)

            const streamNames = streams.map(s => s.name)
            expect(streamNames).toContain('test-available-public-events')
            expect(streamNames).toContain('test-available-permission-changes')
            expect(streamNames).toContain('test-available-custom-events')
        })

        it('returns only public streams for user without permissions', async () => {
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const userId = client.user.id

            const [organization] = await createTestOrganization(admin)
            const organizationId = organization.id

            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: false,
            })

            await createTestOrganizationEmployee(admin, organization, client.user, role, {
                isAccepted: true,
                isRejected: false,
            })

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const streams = await getAvailableStreams(context, userId, organizationId)

            const streamNames = streams.map(s => s.name)
            expect(streamNames).toContain('test-available-public-events')
            expect(streamNames).not.toContain('test-available-permission-changes')
            expect(streamNames).not.toContain('test-available-custom-events')
        })

        it('includes permission field for permission-based streams', async () => {
            const client = await makeClientWithProperty()
            const userId = client.user.id
            const organizationId = client.organization.id

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const streams = await getAvailableStreams(context, userId, organizationId)

            const permissionStream = streams.find(s => s.name === 'test-available-permission-changes')
            expect(permissionStream).toBeDefined()
            expect(permissionStream.permission).toBe('canManageTickets')
        })

        it('includes subjects for all streams', async () => {
            const client = await makeClientWithProperty()
            const userId = client.user.id
            const organizationId = client.organization.id

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const streams = await getAvailableStreams(context, userId, organizationId)

            streams.forEach(stream => {
                expect(stream.subjects).toBeDefined()
                expect(Array.isArray(stream.subjects)).toBe(true)
                expect(stream.subjects.length).toBeGreaterThan(0)
            })
        })
    })
})
