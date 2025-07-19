const {
    createTestB2BApp,
    createTestB2BAppContext,
    createTestB2BAccessToken,
    createTestB2BAppAccessRight,
    createTestB2BAppAccessRightSet,
    updateTestB2BAppAccessRightSet,
} = require('@condo/domains/miniapp/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')
const {
    ACCESS_RIGHT_SET_GLOBAL_TYPE,
    ACCESS_RIGHT_SET_SCOPED_TYPE,
} = require('@condo/domains/miniapp/constants')
const { OrganizationTestMixin } = require('./organization')
const { CONTEXT_FINISHED_STATUS } = require("@condo/domains/miniapp/constants")

const B2B_INTEGRATION_SET = {
    canExecuteRegisterBillingReceipts: true,
    canExecuteRegisterBillingReceiptFile: true,
}

const B2BAppTestMixin = {

    dependsOn: [OrganizationTestMixin],

    async initMixin () {
        this.clients.b2bServiceUser = await makeClientWithServiceUser()
        const [b2bApp] = await createTestB2BApp(this.clients.support)
        const [rightSet] = await createTestB2BAppAccessRightSet(this.clients.support, b2bApp,
            {
                canReadB2BAccessTokens: true,
                canManageB2BAccessTokens: true,
                ...B2B_INTEGRATION_SET,
                type: ACCESS_RIGHT_SET_GLOBAL_TYPE
            })
        await createTestB2BAppAccessRight(this.clients.support, this.clients.b2bServiceUser.user, b2bApp, rightSet)
        const [tokenRightSet] = await createTestB2BAppAccessRightSet(this.clients.support, b2bApp, { ...B2B_INTEGRATION_SET, type: ACCESS_RIGHT_SET_SCOPED_TYPE })
        this.b2bApp = b2bApp
        this.b2bRighSet = rightSet
        this.tokenRightSet = tokenRightSet
        const [b2bAppContext] = await createTestB2BAppContext(this.clients.support, b2bApp, this.organization, { status: CONTEXT_FINISHED_STATUS })
        this.b2bAppContext = b2bAppContext
    },

    async createScopedAccessToken (b2bContextId){
        return await createTestB2BAccessToken(this.clients.b2bServiceUser, { id: b2bContextId }, this.tokenRightSet)
    },

    async updateTokenRightSet (updateInput) {
        return await updateTestB2BAppAccessRightSet(this.clients.support, this.tokenRightSet.id, updateInput)
    },

}

module.exports = {
    B2BAppTestMixin,
}