/**
 * @type {Cypress.PluginConfig}
 */
const isEmpty = require('lodash/isEmpty')

const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { OrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { buildingMapJson } = require('@condo/domains/property/constants/property')
const { makeClientWithProperty, createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket, createTestTicketClassifier } = require('@condo/domains/ticket/utils/testSchema')
const {
    createTestUser,
    createTestForgotPasswordAction,
    ConfirmPhoneAction,
    makeLoggedInClient,
    makeClientWithSupportUser, updateTestUser,
} = require('@condo/domains/user/utils/testSchema')

let userObject = {}
let supportObject = {}

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
        async 'keystone:createUserWithProperty' (forceCreate = false) {
            if (forceCreate || isEmpty(userObject)) {
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
        async 'keystone:createSupportWithProperty' () {
            if (isEmpty(supportObject)) {
                const client = await makeClientWithRegisteredOrganization()
                const property = await createTestProperty(
                    client,
                    client.organization,
                    { map: buildingMapJson },
                    false, {
                        city: 'Екатеринбург',
                        city_with_type: 'г Екатеринбург',
                        street: 'Пушкина',
                        street_with_type: 'ул Пушкина',
                        house: '1',
                        block: '',
                        block_type: '',
                        region_with_type: '',
                    })
                // const client = await makeLoggedInClient(result.userAttrs)
                const cookie = client.getCookie()

                const organizationLink = await OrganizationEmployee.getOne(client, {
                    user: { id: client.userAttrs.id }, isRejected: false, isBlocked: false,
                })

                await updateTestUser(admin, organizationLink.user.id, {
                    isSupport: true,
                })

                const user = Object.assign({}, client.userAttrs)
                supportObject = Object.assign({}, {
                    user,
                    property,
                    cookie,
                    organizationLinkId: organizationLink.id,
                    userAttrs: client.userAttrs,
                    organization: client.organization,
                })

                return supportObject
            }

            return supportObject

        },
        async 'keystone:createTickets' (ticketAttrs) {
            const client = await makeLoggedInClient(ticketAttrs.userAttrs)
            const support = await makeClientWithSupportUser()
            const [ticketClassifier] = await createTestTicketClassifier(support)

            const classifier = { connect: { id: ticketClassifier.id } }
            const ticketExtraFields = { classifier }

            const [ticket] = await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isWarranty: true, ...ticketExtraFields })
            await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isEmergency: true, ...ticketExtraFields })
            await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isPayable: true, ...ticketExtraFields })
            return ticket
        },
    })

    return config

}
