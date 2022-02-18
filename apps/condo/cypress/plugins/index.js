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
const { OrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')


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

            const cookie = client.getCookie()

            const organizationLink = await OrganizationEmployee.getOne(client, {
                user: { id: result.userAttrs.id }, isRejected: false, isBlocked: false,
            })

            return {
                user: result,
                client,
                cookie,
                organizationLinkId: organizationLink.id,
            }
        },

        testTimings (attributes) {
            console.log('Test "%s" has finished in %dms',
                attributes.title, attributes.duration)
            console.table(attributes.commands)

            return null
        },
    })

    return config

}
