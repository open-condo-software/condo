/**
 * @type {Cypress.PluginConfig}
 */
const isEmpty = require('lodash/isEmpty')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const {
    createTestUser,
    createTestForgotPasswordAction,
    ConfirmPhoneAction,
    makeLoggedInClient,
    makeClientWithSupportUser,
} = require('@condo/domains/user/utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { createTestTicket, createTestTicketClassifierRule } = require('@condo/domains/ticket/utils/testSchema')

let userObject = {}

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
            if (isEmpty(userObject)) {
                const result = await makeClientWithProperty()
                const client = await makeLoggedInClient(result.userAttrs)
                const cookie = client.getCookie()

                const organizationLink = await OrganizationEmployee.getOne(client, {
                    user: { id: result.userAttrs.id }, isRejected: false, isBlocked: false,
                })
                const user = Object.assign({}, result.user)
                userObject = Object.assign({}, {
                    user,
                    property: result.property,
                    cookie,
                    organizationLinkId: organizationLink.id,
                    userAttrs: result.userAttrs,
                    organization: result.organization,
                })

                return userObject
            }

            return userObject

        },
        async 'keystone:createTickets' (ticketAttrs) {
            const client = await makeLoggedInClient(ticketAttrs.userAttrs)
            const support = await makeClientWithSupportUser()
            const [ticketClassifierRule] = await createTestTicketClassifierRule(support)

            const classifierRule = { connect: { id: ticketClassifierRule.id } }
            const problemClassifier = { connect: { id: ticketClassifierRule.problem.id } }
            const categoryClassifier = { connect: { id: ticketClassifierRule.category.id } }
            const placeClassifier = { connect: { id: ticketClassifierRule.place.id } }
            const ticketExtraFields = { placeClassifier, categoryClassifier, classifierRule, problemClassifier }

            const [ticket] = await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isWarranty: true, ...ticketExtraFields })
            await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isEmergency: true, ...ticketExtraFields })
            await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isPaid: true, ...ticketExtraFields })
            return ticket
        },
    })

    return config

}
