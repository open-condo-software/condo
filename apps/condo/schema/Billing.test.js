/**
 * @jest-environment node
 */

const { setFakeClientMode, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))

const faker = require('faker')
const { getRandomString } = require('@core/keystone/test.utils')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('./User.test')
const { BillingIntegration, BillingIntegrationAccessRight, BillingIntegrationOrganizationContext, BillingIntegrationLog } = require('./Billing.gql')
const { makeClientWithProperty } = require('./Property.test')

async function createBillingIntegration (client, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    const name = faker.company.companyName()

    const attrs = {
        dv: 1,
        name,
        ...extraAttrs,
    }
    const obj = await BillingIntegration.create(client, attrs)
    return [obj, attrs]
}

async function createBillingIntegrationAccessRight (client, user, integration, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!user.id) throw new Error('no user.id')
    if (!integration.id) throw new Error('no integration.id')

    const attrs = {
        dv: 1,
        user: { connect: { id: user.id } },
        integration: { connect: { id: integration.id } },
        ...extraAttrs,
    }
    const obj = await BillingIntegrationAccessRight.create(client, attrs)
    return [obj, attrs]
}

async function createBillingIntegrationOrganizationContext (client, organization, integration, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!organization.id) throw new Error('no organization.id')
    if (!integration.id) throw new Error('no integration.id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1, sender,
        organization: { connect: { id: organization.id } },
        integration: { connect: { id: integration.id } },
        settings: {
            dv: 1,
            'billing data source': 'https://api.dom.gosuslugi.ru/',
        },
        state: {
            dv: 1,
        },
        ...extraAttrs,
    }
    const obj = await BillingIntegrationOrganizationContext.create(client, attrs)
    return [obj, attrs]
}

async function createBillingIntegrationLog (client, context, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!context.id) throw new Error('no context.id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const type = faker.lorem.words().replace(/[ ]/g, '_').toUpperCase()
    const message = faker.lorem.sentences()
    const meta = { username: faker.lorem.word(), server: faker.internet.url(), ip: faker.internet.ipv6() }

    const attrs = {
        dv: 1, sender,
        context: { connect: { id: context.id } },
        type, message, meta,
        ...extraAttrs,
    }
    const obj = await BillingIntegrationLog.create(client, attrs)
    return [obj, attrs]
}

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
