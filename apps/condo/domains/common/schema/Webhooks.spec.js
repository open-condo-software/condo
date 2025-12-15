/**
 * @jest-environment node
 */

const dayjs = require('dayjs')

const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')
const { DeleteOldWebhookPayloadsTests } = require('@open-condo/webhooks/tasks/deleteOldWebhookPayloads.spec')
const { RetryFailedWebhookPayloadsTests } = require('@open-condo/webhooks/tasks/retryFailedWebhookPayloads.spec')
const { SendWebhookTests } = require('@open-condo/webhooks/tasks/sendWebhook.spec')
const { SendWebhookPayloadTests } = require('@open-condo/webhooks/tasks/sendWebhookPayload.spec')

const { makeClientWithNewRegisteredAndLoggedInUser, updateTestUser } = require('@condo/domains/user/utils/testSchema')

async function initializeActors () {
    const admin = await makeLoggedInAdminClient()
    return {
        admin,
    }
}

async function userCreator () {
    const client = await makeClientWithNewRegisteredAndLoggedInUser()
    return client.user
}

async function userDeleter (client, user) {
    const [updated] = await updateTestUser(client, user.id, {
        deletedAt: dayjs().toISOString(),
    })
    return updated
}

// NOTE 1: Functions with describe inside will be destructured as separate test set
// NOTE 2: Passing init function for actors, since their creation may differ from app to app
// NOTE 3: Passing creator / deleter for testing sending objects with deletedAt
describe('External webhook specifications', () => {
    setFakeClientMode('@app/condo/index', { excludeApps: ['OIDCMiddleware', 'NextApp'] })

    SendWebhookTests('Condo', initializeActors, userCreator, userDeleter)
    SendWebhookPayloadTests('Condo', initializeActors)
    RetryFailedWebhookPayloadsTests('Condo', initializeActors)
    DeleteOldWebhookPayloadsTests('Condo', initializeActors, '@app/condo/index')
})
