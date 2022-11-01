const faker = require('faker')
const dayjs = require('dayjs')
const { generateGQLTestUtils } = require('@condo/codegen/generate.test.utils')

const { WebhookGQL, WebhookSubscriptionGQL } = require('@condo/webhooks/schema/gql')
const Webhook = generateGQLTestUtils(WebhookGQL)
const WebhookSubscription = generateGQLTestUtils(WebhookSubscriptionGQL)

async function createTestWebhook (client, user, extraAttrs = {}) {
    if (!client) throw new Error('No client!')
    if (!user || !user.id) throw new Error('No user!')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const name = faker.company.companyName(0)
    const url = faker.internet.url()

    const attrs = {
        dv: 1,
        sender,
        name,
        url,
        user: { connect: { id: user.id } },
        ...extraAttrs,
    }

    const obj = await Webhook.create(client, attrs)

    return [obj, attrs]
}

async function updateTestWebhook (client, id, extraAttrs = {}) {
    if (!client) throw new Error('No client!')
    if (!id) throw new Error('No id!')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }

    const obj = await Webhook.update(client, id, attrs)

    return [obj, attrs]
}

async function softDeleteTestWebhook (client, id) {
    return await updateTestWebhook(client, id, {
        deletedAt: dayjs().toISOString(),
    })
}

async function createTestWebhookSubscription (client, webhook, extraAttrs = {}) {
    if (!client) throw new Error('No client!')
    if (!webhook || !webhook.id) throw new Error('No webhook!')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        webhook: { connect: { id: webhook.id } },
        syncedAt: dayjs().toISOString(),
        model: 'User',
        fields: 'id',
        filters: {},
        ...extraAttrs,
    }

    const obj = await WebhookSubscription.create(client, attrs)

    return [obj, attrs]
}

async function updateTestWebhookSubscription (client, id, extraAttrs = {}) {
    if (!client) throw new Error('No client!')
    if (!id) throw new Error('No id!')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }

    const obj = await WebhookSubscription.update(client, id, attrs)

    return [obj, attrs]
}

async function softDeleteTestWebhookSubscription (client, id) {
    return await updateTestWebhookSubscription(client, id, {
        deletedAt: dayjs().toISOString(),
    })
}

module.exports = {
    Webhook,
    WebhookSubscription,
    createTestWebhook,
    updateTestWebhook,
    softDeleteTestWebhook,
    createTestWebhookSubscription,
    updateTestWebhookSubscription,
    softDeleteTestWebhookSubscription,
}