const { faker } = require('@faker-js/faker')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { configure, checkAccess, getAvailableChannels, channelRegistry } = require('@open-condo/messaging')
const { getEmployedOrRelatedOrganizationsByPermissions } = require('@condo/domains/organization/utils/accessSchema')
const { createTestOrganization, createTestOrganizationEmployee, createTestOrganizationEmployeeRole, updateTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { Ticket, createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { User, makeClientWithNewRegisteredAndLoggedInUser, createTestUser } = require('@condo/domains/user/utils/testSchema')


describe('NATS Access Control', () => {
    let admin

    let needsDisconnect = false

    beforeAll(async () => {
        configure({
            getPermittedOrganizations: getEmployedOrRelatedOrganizationsByPermissions,
        })

        admin = await makeLoggedInAdminClient()
        if (!conf.TESTS_FAKE_CLIENT_MODE) {
            const { keystone } = getSchemaCtx('User')
            await keystone.connect()
            needsDisconnect = true
        }
    })

    afterAll(async () => {
        if (needsDisconnect) {
            const { keystone } = getSchemaCtx('User')
            await keystone.disconnect()
        }
    })
    describe('checkAccess', () => {
        describe('Boolean true access (public)', () => {
            beforeAll(() => {
                channelRegistry.register('test-public-events', {
                    ttl: 3600,
                    topics: ['test-public-events.>'],
                    access: {
                        read: true,
                    },
                })
            })

            it('allows authenticated user to access public channel', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const userId = client.user.id
                const [organization] = await createTestOrganization(admin)
                const organizationId = organization.id

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkAccess(
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
                channelRegistry.register('test-permission-changes', {
                    ttl: 3600,
                    topics: ['test-permission-changes.>'],
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
                const result = await checkAccess(
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
                const result = await checkAccess(
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
                channelRegistry.register('test-custom-events', {
                    ttl: 3600,
                    topics: ['test-custom-events.>'],
                    access: {
                        read: async ({ authentication, context, organizationId, topic }) => {
                            try {
                                const { item: user } = authentication
                                if (!user || user.deletedAt) return false

                                const ticketId = topic.split('.')[2]
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
                const result = await checkAccess(
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
                const result = await checkAccess(
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
            it('denies access for non-existent channel', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const userId = client.user.id
                const [organization] = await createTestOrganization(admin)
                const organizationId = organization.id

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkAccess(
                    context,
                    userId,
                    organizationId,
                    'non-existent-stream.test.message'
                )

                expect(result.allowed).toBe(false)
                expect(result.reason).toBe('Channel not found')
            })

            it('denies access when channel has no access config', async () => {
                channelRegistry.register('test-no-access-events', {
                    ttl: 3600,
                    topics: ['test-no-access-events.>'],
                })

                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const userId = client.user.id
                const [organization] = await createTestOrganization(admin)
                const organizationId = organization.id

                const keystone = getSchemaCtx('User').keystone
                const context = await keystone.createContext({ skipAccessControl: true })
                const result = await checkAccess(
                    context,
                    userId,
                    organizationId,
                    'test-no-access-events.test.message'
                )

                expect(result.allowed).toBe(false)
                expect(result.reason).toBe('No access configuration for channel')
            })
        })
    })

    describe('getAvailableChannels', () => {
        beforeAll(() => {
            channelRegistry.register('test-available-public-events', {
                ttl: 3600,
                topics: ['test-available-public-events.>'],
                access: {
                    read: true,
                },
            })

            channelRegistry.register('test-available-permission-changes', {
                ttl: 3600,
                topics: ['test-available-permission-changes.>'],
                access: {
                    read: 'canManageTickets',
                },
            })

            channelRegistry.register('test-available-custom-events', {
                ttl: 3600,
                topics: ['test-available-custom-events.>'],
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
            const channels = await getAvailableChannels(context, userId, organizationId)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).toContain('test-available-public-events')
            expect(channelNames).toContain('test-available-permission-changes')
            expect(channelNames).toContain('test-available-custom-events')
        })

        it('returns only public channels for user without permissions', async () => {
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
            const channels = await getAvailableChannels(context, userId, organizationId)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).toContain('test-available-public-events')
            expect(channelNames).not.toContain('test-available-permission-changes')
            expect(channelNames).not.toContain('test-available-custom-events')
        })

        it('includes permission field for permission-based channels', async () => {
            const client = await makeClientWithProperty()
            const userId = client.user.id
            const organizationId = client.organization.id

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, userId, organizationId)

            const permissionChannel = channels.find(s => s.name === 'test-available-permission-changes')
            expect(permissionChannel).toBeDefined()
            expect(permissionChannel.permission).toBe('canManageTickets')
        })

        it('includes topics for all channels', async () => {
            const client = await makeClientWithProperty()
            const userId = client.user.id
            const organizationId = client.organization.id

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, userId, organizationId)

            channels.forEach(channel => {
                expect(channel.topics).toBeDefined()
                expect(Array.isArray(channel.topics)).toBe(true)
                expect(channel.topics.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Cross-organization access isolation', () => {
        it('non-employee user cannot access permission-based channels of organization', async () => {
            const outsiderClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const targetOrgClient = await makeClientWithProperty()

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, outsiderClient.user.id, targetOrgClient.organization.id)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).not.toContain('test-available-permission-changes')
            expect(channelNames).not.toContain('test-available-custom-events')
        })

        it('employee of org-A gets NO permission-based channels for org-B', async () => {
            const clientA = await makeClientWithProperty()
            const clientB = await makeClientWithProperty()

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, clientA.user.id, clientB.organization.id)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).not.toContain('test-available-permission-changes')
        })

        it('denies non-employee user access to permission-based channel of another organization', async () => {
            const outsiderClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const targetOrgClient = await makeClientWithProperty()

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(
                context,
                outsiderClient.user.id,
                targetOrgClient.organization.id,
                'test-permission-changes.test.message'
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('Permission denied')
        })

        it('employee of org-A cannot access custom channel of org-B', async () => {
            const clientA = await makeClientWithProperty()
            const clientB = await makeClientWithProperty()
            const [ticket] = await createTestTicket(clientB, clientB.organization, clientB.property)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(
                context,
                clientA.user.id,
                clientB.organization.id,
                `test-custom-events.${clientB.organization.id}.${ticket.id}`
            )

            expect(result.allowed).toBe(false)
        })
    })

    describe('Deleted and blocked users denied access', () => {
        it('soft-deleted user gets NO channels', async () => {
            const [user] = await createTestUser(admin)
            const [organization] = await createTestOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: true,
            })
            await createTestOrganizationEmployee(admin, organization, user, role, {
                isAccepted: true,
                isRejected: false,
                isBlocked: false,
            })

            await User.softDelete(admin, user.id)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, user.id, organization.id)

            expect(channels).toHaveLength(0)
        })

        it('checkAccess denies soft-deleted user', async () => {
            const [user] = await createTestUser(admin)
            const [organization] = await createTestOrganization(admin)

            await User.softDelete(admin, user.id)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(
                context,
                user.id,
                organization.id,
                'test-permission-changes.test.message'
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('User not found or deleted')
        })

        it('non-existent user gets NO channels', async () => {
            const fakeUserId = faker.datatype.uuid()
            const [organization] = await createTestOrganization(admin)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, fakeUserId, organization.id)

            expect(channels).toHaveLength(0)
        })

        it('checkAccess denies non-existent user', async () => {
            const fakeUserId = faker.datatype.uuid()
            const [organization] = await createTestOrganization(admin)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(
                context,
                fakeUserId,
                organization.id,
                'test-permission-changes.test.message'
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('User not found or deleted')
        })

        it('blocked employee gets NO permission-based channels', async () => {
            const [organization] = await createTestOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: true,
            })
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const [employee] = await createTestOrganizationEmployee(admin, organization, client.user, role, {
                isAccepted: true,
                isRejected: false,
                isBlocked: false,
            })

            await updateTestOrganizationEmployee(admin, employee.id, { isBlocked: true })

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, client.user.id, organization.id)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).not.toContain('test-available-permission-changes')
            expect(channelNames).not.toContain('test-available-custom-events')
        })

        it('rejected employee gets NO permission-based channels', async () => {
            const [organization] = await createTestOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, {
                canManageTickets: true,
            })
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            await createTestOrganizationEmployee(admin, organization, client.user, role, {
                isAccepted: false,
                isRejected: true,
                isBlocked: false,
            })

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, client.user.id, organization.id)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).not.toContain('test-available-permission-changes')
            expect(channelNames).not.toContain('test-available-custom-events')
        })
    })
})
