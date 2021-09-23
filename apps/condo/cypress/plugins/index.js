/**
 * @type {Cypress.PluginConfig}
 */
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const {
    createTestUser,
    createTestForgotPasswordAction,
    ConfirmPhoneAction,
} = require('@condo/domains/user/utils/testSchema')

module.exports = async (on, config) => {

    const admin = await makeLoggedInAdminClient()

    on('task', {
        async 'keystone:createUser' () {
            const result = await createTestUser(admin)
            return result
        },
        async 'keystone:createForgotPasswordAction' (user) {
            const result = await createTestForgotPasswordAction(admin, user)
            return result
        },
        async 'keystone:getConfirmPhoneAction' (phone) {
            const result = await ConfirmPhoneAction.getAll(admin, {  phone })
            return result
        },
    })

    return config

}
