const { faker } = require('@faker-js/faker')

const conf = require('@open-condo/config')
const { getSchemaCtx, find } = require('@open-condo/keystone/schema')
const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { configure, checkAccess, getAvailableChannels } = require('@open-condo/messaging')

const { createTestOrganization, createTestOrganizationEmployee, createTestOrganizationEmployeeRole, updateTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { User, makeClientWithNewRegisteredAndLoggedInUser, createTestUser } = require('@condo/domains/user/utils/testSchema')


describe('Messaging Access Control', () => {
    let admin

    let needsDisconnect = false

    beforeAll(async () => {
        configure({
            accessCheckers: {
                organization: async (context, userId, organizationId) => {
                    const employees = await find('OrganizationEmployee', {
                        user: { id: userId },
                        organization: { id: organizationId },
                        isAccepted: true,
                        isRejected: false,
                        isBlocked: false,
                        deletedAt: null,
                    })
                    return employees.length > 0
                },
            },
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

    describe('checkAccess — user channel', () => {
        it('allows authenticated user to access own user channel', async () => {
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const userId = client.user.id

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(context, userId, `user.${userId}.notification`)

            expect(result.allowed).toBe(true)
            expect(result.user).toEqual(userId)
        })

        it('denies access to another user channel', async () => {
            const client1 = await makeClientWithNewRegisteredAndLoggedInUser()
            const client2 = await makeClientWithNewRegisteredAndLoggedInUser()

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(context, client1.user.id, `user.${client2.user.id}.notification`)

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('Cannot access other user channel')
        })
    })

    describe('checkAccess — organization channel', () => {
        it('allows active employee to access organization channel', async () => {
            const [organization] = await createTestOrganization(admin)
            const [role] = await createTestOrganizationEmployeeRole(admin, organization, { canReadTickets: true })
            const employeeUser = await makeClientWithNewRegisteredAndLoggedInUser()
            await createTestOrganizationEmployee(admin, organization, employeeUser.user, role, {
                isRejected: false,
                isAccepted: true,
                isBlocked: false,
            })

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(
                context,
                employeeUser.user.id,
                `organization.${organization.id}.ticket`
            )

            expect(result.allowed).toBe(true)
            expect(result.user).toEqual(employeeUser.user.id)
            expect(result.organization).toEqual(organization.id)
        })

        it('denies non-employee user access to organization channel', async () => {
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await createTestOrganization(admin)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(
                context,
                client.user.id,
                `organization.${organization.id}.ticket`
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('Access denied for organization channel')
        })

        it('denies access for unknown channel prefix', async () => {
            const client = await makeClientWithNewRegisteredAndLoggedInUser()

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(context, client.user.id, 'unknown.topic')

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('No access checker for channel: unknown')
        })
    })

    describe('getAvailableChannels', () => {
        it('returns user and organization channels for active employee', async () => {
            const client = await makeClientWithProperty()
            const userId = client.user.id
            const organizationId = client.organization.id

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, userId, organizationId)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).toContain('user')
            expect(channelNames).toContain('organization')
            expect(channels).toHaveLength(2)

            const userChannel = channels.find(c => c.name === 'user')
            expect(userChannel.topic).toBe(`user.${userId}.>`)

            const orgChannel = channels.find(c => c.name === 'organization')
            expect(orgChannel.topic).toBe(`organization.${organizationId}.>`)
        })

        it('returns only user channel for non-employee', async () => {
            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            const [organization] = await createTestOrganization(admin)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, client.user.id, organization.id)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).toContain('user')
            expect(channelNames).not.toContain('organization')
            expect(channels).toHaveLength(1)
        })
    })

    describe('Cross-organization access isolation', () => {
        it('non-employee cannot access organization channel', async () => {
            const outsiderClient = await makeClientWithNewRegisteredAndLoggedInUser()
            const targetOrgClient = await makeClientWithProperty()

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, outsiderClient.user.id, targetOrgClient.organization.id)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).not.toContain('organization')
        })

        it('employee of org-A gets NO organization channel for org-B', async () => {
            const clientA = await makeClientWithProperty()
            const clientB = await makeClientWithProperty()

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const channels = await getAvailableChannels(context, clientA.user.id, clientB.organization.id)

            const channelNames = channels.map(s => s.name)
            expect(channelNames).not.toContain('organization')
        })

        it('employee of org-A cannot checkAccess organization topic of org-B', async () => {
            const clientA = await makeClientWithProperty()
            const clientB = await makeClientWithProperty()

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(
                context,
                clientA.user.id,
                `organization.${clientB.organization.id}.ticket`
            )

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('Access denied for organization channel')
        })
    })

    describe('Deleted and blocked users denied access', () => {
        it('user with access loses ALL channels immediately after soft-delete', async () => {
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

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })

            // Before: user has access
            const channelsBefore = await getAvailableChannels(context, user.id, organization.id)
            expect(channelsBefore.map(s => s.name)).toContain('organization')

            const accessBefore = await checkAccess(context, user.id, `organization.${organization.id}.ticket`)
            expect(accessBefore.allowed).toBe(true)

            // Soft-delete
            await User.softDelete(admin, user.id)

            // After: access revoked immediately
            const channelsAfter = await getAvailableChannels(context, user.id, organization.id)
            expect(channelsAfter).toHaveLength(0)

            const accessAfter = await checkAccess(context, user.id, `organization.${organization.id}.ticket`)
            expect(accessAfter.allowed).toBe(false)
            expect(accessAfter.reason).toBe('User not found or deleted')
        })

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

        it('checkAccess denies soft-deleted user on user channel', async () => {
            const [user] = await createTestUser(admin)

            await User.softDelete(admin, user.id)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(context, user.id, `user.${user.id}.notification`)

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('User not found or deleted')
        })

        it('checkAccess denies soft-deleted user on organization channel', async () => {
            const [user] = await createTestUser(admin)
            const [organization] = await createTestOrganization(admin)

            await User.softDelete(admin, user.id)

            const keystone = getSchemaCtx('User').keystone
            const context = await keystone.createContext({ skipAccessControl: true })
            const result = await checkAccess(context, user.id, `organization.${organization.id}.ticket`)

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
            const result = await checkAccess(context, fakeUserId, `organization.${organization.id}.ticket`)

            expect(result.allowed).toBe(false)
            expect(result.reason).toBe('User not found or deleted')
        })

        it('blocked employee gets NO organization channel', async () => {
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
            expect(channelNames).not.toContain('organization')
        })

        it('rejected employee gets NO organization channel', async () => {
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
            expect(channelNames).not.toContain('organization')
        })
    })
})
