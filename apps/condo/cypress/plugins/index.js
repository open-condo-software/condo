/**
 * @type {Cypress.PluginConfig}
 */
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const {
    createTestUser,
    createTestForgotPasswordAction,
    ConfirmPhoneAction,
    makeLoggedInClient,
} = require('@condo/domains/user/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')

module.exports = async (on, config) => {

    const admin = await makeLoggedInAdminClient()

    on('task', {
        async 'keystone:createUser' () {
            return await createTestUser(admin)
        },
        async 'keystone:createForgotPasswordAction' (user) {
            return await createTestForgotPasswordAction(admin, user)
        },
        async 'keystone:getConfirmPhoneAction' (phone) {
            return await ConfirmPhoneAction.getAll(admin, { phone })
        },
        async 'keystone:createUserWithProperty' () {
            const result = await makeClientWithProperty()
            const client = await makeLoggedInClient(result.userAttrs)
            return {
                user: result,
                client,
                cookie: client.getCookie(),
            }
        },
    })

    return config

}
