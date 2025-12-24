const { makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')
const { WebhookTests } = require('@open-condo/webhooks/schema/models/Webhook.test')
const { WebhookPayloadTests } = require('@open-condo/webhooks/schema/models/WebhookPayload.test')
const {
    WebhookSubscriptionBasicTests,
    WebhookSubscriptionModelSwitchTests, 
} = require('@open-condo/webhooks/schema/models/WebhookSubscription.test')

const { WEBHOOK_EVENTS } = require('@condo/domains/common/constants/webhooks')
const { makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

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

const secondModel = {
    name: 'Organization',
    fields: 'tin',
    filters: { tin_in: ['123'] },
}

// NOTE 1: Functions with describe inside will be destructured as separate test set
// NOTE 2: Passing init function for actors, since their creation may differ from app to app
// NOTE 3: Testing on User (for now / by default) since it's a common model across all apps
// NOTE 4: Testing of model switch is optional, for it's correct work second model must be uuided
// and its fields / filters must not intersect with User ones (see sample above)
describe('External webhook tests', () => {
    WebhookTests('Condo', initializeActors)
    WebhookPayloadTests('Condo', initializeActors, WEBHOOK_EVENTS)
    WebhookSubscriptionBasicTests('Condo', initializeActors)
    WebhookSubscriptionModelSwitchTests('Condo', initializeActors, secondModel)
})