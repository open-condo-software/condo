const {
    createTestAcquiringIntegration,
    createTestAcquiringIntegrationAccessRight,
    createTestAcquiringIntegrationContext,
    updateTestAcquiringIntegrationContext,
    updateTestAcquiringIntegration,
} = require('./index')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')

const AcquiringTestMixin = {
    async initMixin () {
        const [acquiringIntegration] = await createTestAcquiringIntegration(this.clients.admin)
        await createTestAcquiringIntegrationAccessRight(this.clients.admin, acquiringIntegration, this.clients.service.user)
        this.acquiringIntegration = acquiringIntegration
        const [acquiringContext] = await createTestAcquiringIntegrationContext(this.clients.admin, this.organization, acquiringIntegration, { status: CONTEXT_FINISHED_STATUS })
        this.acquiringContext = acquiringContext
    },
    async updateAcquiringContext (updateInput) {
        await updateTestAcquiringIntegrationContext(this.clients.admin, this.acquiringContext.id, updateInput)
    },
    async updateTestAcquiringIntegration (updateInput) {
        await updateTestAcquiringIntegration(this.clients.admin, this.acquiringIntegration.id, updateInput)
    }
}

module.exports = {
    AcquiringTestMixin,
}