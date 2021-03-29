const faker = require('faker')
const {
    BillingIntegration,
    BillingIntegrationAccessRight,
    BillingIntegrationOrganizationContext,
    BillingIntegrationLog,
} = require('../../gql/Billing')

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

module.exports = {
    createBillingIntegrationAccessRight,
    createBillingIntegrationOrganizationContext,
    createBillingIntegrationLog,
}