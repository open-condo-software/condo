const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { generateGQLTestUtils } = require('@open-condo/codegen/generate.test.utils')
const { WebhookGQL, WebhookSubscriptionGQL, WebhookPayloadGQL } = require('@open-condo/webhooks/schema/gql')

const Webhook = generateGQLTestUtils(WebhookGQL)
const WebhookSubscription = generateGQLTestUtils(WebhookSubscriptionGQL)
const WebhookPayload = generateGQLTestUtils(WebhookPayloadGQL)

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
        syncedAmount: 0,
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

async function createTestWebhookPayload (client, extraAttrs = {}) {
    if (!client) throw new Error('No client!')

    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        payload: JSON.stringify({ eventType: 'User.created', data: { test: true } }),
        url: faker.internet.url(),
        secret: faker.random.alphaNumeric(32),
        eventType: 'User.created',
        ...extraAttrs,
    }

    const obj = await WebhookPayload.create(client, attrs)

    return [obj, attrs]
}

async function updateTestWebhookPayload (client, id, extraAttrs = {}) {
    if (!client) throw new Error('No client!')
    if (!id) throw new Error('No id!')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }

    const obj = await WebhookPayload.update(client, id, attrs)

    return [obj, attrs]
}

async function softDeleteTestWebhookPayload (client, id) {
    return await updateTestWebhookPayload(client, id, {
        deletedAt: dayjs().toISOString(),
    })
}

module.exports = {
    Webhook,
    WebhookSubscription,
    WebhookPayload,
    createTestWebhook,
    updateTestWebhook,
    softDeleteTestWebhook,
    createTestWebhookSubscription,
    updateTestWebhookSubscription,
    softDeleteTestWebhookSubscription,
    createTestWebhookPayload,
    updateTestWebhookPayload,
    softDeleteTestWebhookPayload,
}