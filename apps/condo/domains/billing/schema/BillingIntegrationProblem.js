const { versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/billing/access/BillingIntegrationProblem')
const { BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/serverSchema')


const { INTEGRATION_CONTEXT_FIELD } = require('./fields/relations')


const BillingIntegrationProblem = new GQLListSchema('BillingIntegrationProblem', {
    schemaDoc: 'Report about an error that occurred during integration process. There\'s 2 target groups for it: ' +
        'Organization employees will see title and message of last problem, so they can be notified, that something went wrong. ' +
        'Support can also read problem messages as well as metadata, which helps them to resolve an issue.',
    fields: {
        context: INTEGRATION_CONTEXT_FIELD,
        title: {
            schemaDoc: 'Problem summary, like "Wrong requisites", "No access provided" and so on',
            type: 'Text',
            isRequired: true,
        },
        message: {
            schemaDoc: 'Client understandable message, describing what should client do to fix a problem',
            type: 'Text',
            isRequired: true,
        },
        meta: {
            schemaDoc: 'The message metadata, which can help support to resolve an issue',
            type: 'Json',
            isRequired: false,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), analytical()],
    access: {
        read: access.canReadBillingIntegrationProblems,
        create: access.canManageBillingIntegrationProblems,
        update: access.canManageBillingIntegrationProblems,
        delete: false,
        auth: true,
    },
    hooks: {
        afterChange: async ({ operation, updatedItem, context }) => {
            if (operation === 'create') {
                const id = updatedItem['id']
                const contextId = updatedItem['context']
                await BillingIntegrationOrganizationContext.update(context, contextId, {
                    currentProblem: { connect: { id } },
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'problem-after-change' },
                })
            }
        },
    },
})

module.exports = {
    BillingIntegrationProblem,
}
