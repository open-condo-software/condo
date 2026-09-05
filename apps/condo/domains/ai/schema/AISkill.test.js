const { makeLoggedInAdminClient, makeClient,
    expectToThrowAuthenticationErrorToObj, expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj, expectToThrowValidationFailureError,
} = require('@open-condo/keystone/test.utils')

const { AISkill, createTestAISkill, updateTestAISkill } = require('@condo/domains/ai/utils/testSchema')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { createTestB2BApp, createTestB2BAppContext } = require('@condo/domains/miniapp/utils/testSchema')
const { createTestOrganization, registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const {
    createTestUserRightsSet,
    makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithSupportUser,
} = require('@condo/domains/user/utils/testSchema')


describe('AISkill', () => {
    let admin
    let support
    let user
    let anotherUser
    let directAccessUser
    let anonymous
    let organization
    let anotherOrganization
    let connectedApp
    let disconnectedApp

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeClientWithSupportUser()
        user = await makeClientWithNewRegisteredAndLoggedInUser()
        anotherUser = await makeClientWithNewRegisteredAndLoggedInUser()
        anonymous = await makeClient()

        const [rightsSet] = await createTestUserRightsSet(support, {
            canReadAISkills: true,
            canManageAISkills: true,
        })
        directAccessUser = await makeClientWithNewRegisteredAndLoggedInUser({
            rightsSet: { connect: { id: rightsSet.id } },
        })

        const [createdOrganization] = await registerNewOrganization(user)
        const [createdAnotherOrganization] = await createTestOrganization(admin)
        const [createdConnectedApp] = await createTestB2BApp(support)
        const [createdDisconnectedApp] = await createTestB2BApp(support)
        organization = createdOrganization
        anotherOrganization = createdAnotherOrganization
        connectedApp = createdConnectedApp
        disconnectedApp = createdDisconnectedApp
        await createTestB2BAppContext(support, connectedApp, organization, {
            status: CONTEXT_FINISHED_STATUS,
        })
    })

    describe('CRUD', () => {
        test.each([
            ['admin', () => admin],
            ['support', () => support],
            ['direct access user', () => directAccessUser],
        ])('%s can create and update', async (name, getClient) => {
            const client = getClient()
            const [created] = await createTestAISkill(client)
            const [updated] = await updateTestAISkill(client, created.id, { displayName: `${name} skill` })

            expect(created).toHaveProperty('id')
            expect(updated).toMatchObject({ id: created.id, displayName: `${name} skill`, v: 2 })
        })

        test('regular user cannot create or update', async () => {
            await expectToThrowAccessDeniedErrorToObj(async () => await createTestAISkill(user))

            const [created] = await createTestAISkill(admin)
            await expectToThrowAccessDeniedErrorToObj(async () => await updateTestAISkill(user, created.id))
        })

        test('anonymous cannot create or update', async () => {
            await expectToThrowAuthenticationErrorToObj(async () => await createTestAISkill(anonymous))

            const [created] = await createTestAISkill(admin)
            await expectToThrowAuthenticationErrorToObj(async () => await updateTestAISkill(anonymous, created.id))
        })

        test('hard delete is disabled', async () => {
            const [created] = await createTestAISkill(admin)
            await expectToThrowAccessDeniedErrorToObj(async () => await AISkill.delete(admin, created.id))
        })
    })

    describe('read access', () => {
        test('regular user sees only public skills available to them', async () => {
            const [globalSkill] = await createTestAISkill(admin)
            const [organizationSkill] = await createTestAISkill(admin, {
                scope: 'organization',
                organization: { connect: { id: organization.id } },
            })
            const [personalSkill] = await createTestAISkill(admin, {
                scope: 'personal',
                user: { connect: { id: user.user.id } },
            })
            const [connectedAppSkill] = await createTestAISkill(admin, {
                scope: 'b2bApp',
                b2bApp: { connect: { id: connectedApp.id } },
            })
            const [privateSkill] = await createTestAISkill(admin, { isPublic: false })
            const [anotherOrganizationSkill] = await createTestAISkill(admin, {
                scope: 'organization',
                organization: { connect: { id: anotherOrganization.id } },
            })
            const [anotherPersonalSkill] = await createTestAISkill(admin, {
                scope: 'personal',
                user: { connect: { id: anotherUser.user.id } },
            })
            const [disconnectedAppSkill] = await createTestAISkill(admin, {
                scope: 'b2bApp',
                b2bApp: { connect: { id: disconnectedApp.id } },
            })

            const skills = await AISkill.getAll(user, {
                id_in: [
                    globalSkill.id,
                    organizationSkill.id,
                    personalSkill.id,
                    connectedAppSkill.id,
                    privateSkill.id,
                    anotherOrganizationSkill.id,
                    anotherPersonalSkill.id,
                    disconnectedAppSkill.id,
                ],
            })

            expect(skills.map(skill => skill.id)).toEqual(expect.arrayContaining([
                globalSkill.id,
                organizationSkill.id,
                personalSkill.id,
                connectedAppSkill.id,
            ]))
            expect(skills.map(skill => skill.id)).not.toEqual(expect.arrayContaining([
                privateSkill.id,
                anotherOrganizationSkill.id,
                anotherPersonalSkill.id,
                disconnectedAppSkill.id,
            ]))
        })

        test('support and direct access users can read private skills', async () => {
            const [privateSkill] = await createTestAISkill(admin, { isPublic: false })

            await expect(AISkill.getAll(support, { id: privateSkill.id })).resolves.toHaveLength(1)
            await expect(AISkill.getAll(directAccessUser, { id: privateSkill.id })).resolves.toHaveLength(1)
        })

        test('anonymous cannot read', async () => {
            await expectToThrowAuthenticationErrorToObjects(async () => await AISkill.getAll(anonymous, {}))
        })
    })

    describe('validation', () => {
        test('validates Agent Skills fields', async () => {
            await expectToThrowValidationFailureError(
                async () => await createTestAISkill(admin, { name: 'Invalid name' }),
                'Skill name must contain only lowercase letters, numbers, and hyphens'
            )
            await expectToThrowValidationFailureError(
                async () => await createTestAISkill(admin, { description: ' ' }),
                'Skill description must not be empty'
            )
            await expectToThrowValidationFailureError(
                async () => await createTestAISkill(admin, { content: ' ' }),
                'Skill content must not be empty'
            )
        })

        test('requires relation matching scope', async () => {
            await expectToThrowValidationFailureError(
                async () => await createTestAISkill(admin, { scope: 'organization' }),
                'organization must be set when scope is "organization"'
            )
            await expectToThrowValidationFailureError(
                async () => await createTestAISkill(admin, { scope: 'personal' }),
                'user must be set when scope is "personal"'
            )
            await expectToThrowValidationFailureError(
                async () => await createTestAISkill(admin, { scope: 'b2bApp' }),
                'b2bApp must be set when scope is "b2bApp"'
            )
        })

        test('rejects relations not matching scope', async () => {
            await expectToThrowValidationFailureError(
                async () => await createTestAISkill(admin, {
                    scope: 'global',
                    organization: { connect: { id: organization.id } },
                }),
                'organization must not be set when scope is "global"'
            )
        })
    })
})
