const { makeClientWithRegisteredOrganization } = require('../../../utils/testSchema/Organization')
const { Organization } = require('@condo/domains/organization/gql')
const { makeLoggedInClient, makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')

const { createOrganization } = require('../../../utils/testSchema/Organization')

describe('Organization', () => {
    test('anonymous: no access to getAll', async () => {
        const client = await makeClient()
        const { data, errors } = await Organization.getAll(client, {}, { raw: true })
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'allOrganizations', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['objs'],
        })
        expect(data).toEqual({ 'objs': null })
    })

    test('anonymous: no access to count', async () => {
        const client = await makeClient()
        const { data, errors } = await Organization.count(client, {}, { raw: true })
        expect(errors[0]).toMatchObject({
            'data': { 'target': '_allOrganizationsMeta', 'type': 'query' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['meta', 'count'],
        })
        expect(data).toEqual({ meta: { count: null } })
    })

    test('user: can read only organizations, it employed in', async () => {
        const admin = await makeLoggedInAdminClient()
        await createOrganization(admin)
        const client = await makeClientWithRegisteredOrganization()

        const objs = await Organization.getAll(client, {})
        expect(objs.length).toBe(1)
    })

    test('user: allow to count', async () => {
        const admin = await makeLoggedInAdminClient()
        await createOrganization(admin)
        const [, userAttrs] = await createTestUser(admin)
        const client = await makeLoggedInClient(userAttrs)
        const count = await Organization.count(client, {})
        expect(count).toBeGreaterThan(0)
    })

    test('default status transitions is defined', async () => {
        const { organization } = await makeClientWithRegisteredOrganization()

        expect(organization.statusTransitions).toBeDefined()
        expect(organization.defaultEmployeeRoleStatusTransitions).toBeDefined()
    })
    // test('no access to change another organization', async () => {
//     const { id: organizationId } = await createSchemaObject(Organization)
//     const { id: linkId } = await createSchemaObject(OrganizationToUserLink, {
//         organization: { connect: { id: organizationId } },
//         role: 'owner',
//     })
//
//     const user = await createUser()
//     const client = await makeLoggedInClient(user)
//     const { errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
//         data: { name: faker.company.companyName(), description: faker.lorem.paragraph() },
//     })
//     expect(errors).toEqual(undefined)
//
//     const { errors: err1 } = await client.mutate(UPDATE_ORGANIZATION_TO_USER_LINK_MUTATION, {
//         id: linkId,
//         data: { user: { connect: { id: user.id } } },
//     })
//     expect(err1[0]).toMatchObject({
//         'data': { 'target': 'updateOrganizationToUserLink', 'type': 'mutation' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['obj'],
//     })
//     const { errors: err2 } = await client.mutate(UPDATE_ORGANIZATION_TO_USER_LINK_MUTATION, {
//         id: linkId,
//         data: { role: 'member' },
//     })
//     expect(err2[0]).toMatchObject({
//         'data': { 'target': 'updateOrganizationToUserLink', 'type': 'mutation' },
//         'message': 'You do not have access to this resource',
//         'name': 'AccessDeniedError',
//         'path': ['obj'],
//     })
// })
})