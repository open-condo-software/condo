const { makeLoggedInAdminClient, makeClient } = require('@condo/keystone/test.utils')
const { makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { WebhookTests } = require('@condo/webhooks/schema/models/Webhook.test')
const { WebhookSubscriptionTests } = require('@condo/webhooks/schema/models/WebhookSubscription.test')

async function initializeActors () {
    const admin = await makeLoggedInAdminClient()
    const support = await makeClientWithSupportUser()
    const user = await makeClientWithNewRegisteredAndLoggedInUser()
    const anonymous = await makeClient()
    return {
        admin,
        support,
        user,
        anonymous,
    }
}

// NOTE 1: Functions with describe inside will be destructured as separate test set
// NOTE 2: Passing init function for actors, since their creation may differ from app to app
// NOTE 3: Testing on User model (for now / by default) since it's a common model across all apps
describe('External webhook tests', () => {
    WebhookTests('Condo', initializeActors)
    WebhookSubscriptionTests('Condo', initializeActors)
})