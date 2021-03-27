const { makeLoggedInAdminClient, getRandomString } = require('@core/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const {
    createBillingIntegrationLog,
    createBillingIntegrationOrganizationContext,
    createBillingIntegrationAccessRight,
    createBillingIntegration,
} = require('../utils/testSchema/Billing')
const { BillingIntegrationLog, BillingIntegrationOrganizationContext } = require('../gql/Billing')

const { makeClientWithProperty } = require('./Property/Property.test')

describe('BillingIntegration', () => {
    test('admin: createBillingIntegration', async () => {
        const admin = await makeLoggedInAdminClient()
        const [integration, attrs] = await createBillingIntegration(admin)
        expect(integration).toEqual(expect.objectContaining({
            name: attrs.name,
        }))
    })
})

describe('BillingIntegrationOrganizationContext', () => {
    test('user: create/update integration context', async () => {
        const integrationClient = await makeClientWithNewRegisteredAndLoggedInUser()
        // const hackerClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const adminClient = await makeLoggedInAdminClient()
        const [integration] = await createBillingIntegration(adminClient)
        await createBillingIntegrationAccessRight(adminClient, integrationClient.user, integration)

        // user setup the Integration for his organization
        const userClient = await makeClientWithProperty()
        const [context] = await createBillingIntegrationOrganizationContext(userClient, userClient.organization, integration)
        expect(context.id).toBeTruthy()

        // integration account can see integration
        const contexts = await BillingIntegrationOrganizationContext.getAll(integrationClient)
        // TODO(pahaz): wait https://github.com/keystonejs/keystone/issues/4829
        // expect(contexts).toHaveLength(1)
        expect(contexts).toContainEqual(expect.objectContaining({ id: context.id }))

        // integration account update integration state
        const updatedContext1 = await BillingIntegrationOrganizationContext.update(
            integrationClient, context.id, { state: { dv: 1, foo: 1 } })
        expect(updatedContext1.state.foo).toEqual(1)

        // user also can update integration context
        const updatedContext2 = await BillingIntegrationOrganizationContext.update(
            userClient, context.id, { state: { dv: 1, foo: 2 } })
        expect(updatedContext2.state.foo).toEqual(2)

        // admin also can update integration context
        const updatedContext3 = await BillingIntegrationOrganizationContext.update(
            adminClient, context.id, { state: { dv: 1, foo: 3 } })
        expect(updatedContext3.state.foo).toEqual(3)

        // hacker client doesn't have access to integration context
        // TODO(pahaz): wait https://github.com/keystonejs/keystone/issues/4829
        // const hackerResult = await BillingIntegrationOrganizationContext.getAll(hackerClient, { id: context.id })
        // expect(hackerResult).toEqual([])
    })
})

describe('BillingIntegrationLog', () => {
    test('user: can see the logs', async () => {
        const integrationClient = await makeClientWithNewRegisteredAndLoggedInUser()
        // const hackerClient = await makeClientWithNewRegisteredAndLoggedInUser()
        const adminClient = await makeLoggedInAdminClient()
        const [integration] = await createBillingIntegration(adminClient)
        await createBillingIntegrationAccessRight(adminClient, integrationClient.user, integration)

        // user setup the Integration for his organization
        const userClient = await makeClientWithProperty()
        const [context] = await createBillingIntegrationOrganizationContext(userClient, userClient.organization, integration)

        // integration account create log record
        const message = getRandomString()
        const [logMessage] = await createBillingIntegrationLog(integrationClient, context, { message })
        expect(logMessage.id).toBeTruthy()

        // user can see the log record
        const logs = await BillingIntegrationLog.getAll(userClient, { context: { id: context.id } })
        expect(logs).toEqual([expect.objectContaining({ message })])

        // user doesn't have access to change log record
        const { errors } = await BillingIntegrationLog.update(userClient, logMessage.id, { message: 'no message' }, { raw: true })
        expect(errors[0]).toMatchObject({
            'data': { 'target': 'updateBillingIntegrationLog', 'type': 'mutation' },
            'message': 'You do not have access to this resource',
            'name': 'AccessDeniedError',
            'path': ['obj'],
        })

        // hacker client doesn't have access to the integration log record
        // TODO(pahaz): wait https://github.com/keystonejs/keystone/issues/4829
        // const hackerResult = await BillingIntegrationLog.getAll(hackerClient, { context: { id: context.id } })
        // expect(hackerResult).toEqual([])
    })
})
