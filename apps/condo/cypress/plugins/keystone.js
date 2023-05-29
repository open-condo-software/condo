/**
 * @type {Cypress.PluginConfig}
 */
const isEmpty = require('lodash/isEmpty')
const { range } = require('lodash')

const { resetOrganizationByTestClient } = require('@condo/domains/organization/utils/testSchema')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { buildingMapJson } = require('@condo/domains/property/constants/property')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { resetUserByTestClient } = require('@condo/domains/user/utils/testSchema')
const {
    createTestUser,
    createTestForgotPasswordAction,
    ConfirmPhoneAction,
    makeLoggedInClient,
    updateTestUser,
} = require('@condo/domains/user/utils/testSchema')

let userObject = {}
let supportObject = {}

const createdUsers = []
const createdOrganizations = []

const resetUser = async (supportClient, id) => {
    const payload = { user: { id } }
    await resetUserByTestClient(supportClient, payload)
}

const resetOrganization = async (supportClient, id) => {
    const payload = { organizationId: id }
    await resetOrganizationByTestClient(supportClient, payload)
}

const cypressCreateTestUser = async (supportClient) => {
    const createdUser = await createTestUser(supportClient)
    createdUsers.push(createdUser[0].id)
    return createdUser
}

const cypressMakeClientWithRegisteredOrganization = async (supportClient) => {
    const client = await makeClientWithRegisteredOrganization(supportClient)
    createdUsers.push(client.user.id)
    createdOrganizations.push(client.organization.id)
    return client
}

module.exports = async (on, config) => {

    const supportEmail = config.env.supportEmail
    const supportPassword = config.env.supportPassword
    if (!supportEmail || !supportPassword) {
        throw new Error('Please provide cypress with support credentials for correct user creation')
    }

    const supportClient = await makeLoggedInClient({ email: supportEmail, password: supportPassword })

    const admin = null

    on('task', {
        async 'keystone:createUser' () {
            return await cypressCreateTestUser(supportClient)
        },

        async 'keystone:createForgotPasswordAction' (user) {
            return await createTestForgotPasswordAction(supportClient, user)
        },

        async 'keystone:getConfirmPhoneAction' (phone) {
            return await ConfirmPhoneAction.getAll(supportClient, { phone })
        },

        async 'keystone:createUserWithProperty' () {
            const result = await cypressMakeClientWithRegisteredOrganization()

            const client = await makeLoggedInClient(result.userAttrs)
            const cookie = client.getCookie()

            const [property] = await createTestProperty(supportClient, result.organization, { map: buildingMapJson })

            const organizationLink = await OrganizationEmployee.getOne(client, {
                user: { id: result.userAttrs.id }, isRejected: false, isBlocked: false,
            })
            const user = Object.assign({}, result.user)
            userObject = Object.assign({}, {
                user,
                property: property,
                cookie,
                organizationLinkId: organizationLink.id,
                userAttrs: result.userAttrs,
                organization: result.organization,
            })

            return userObject
        },

        async 'keystone:createProperty' (organization) {
            const [result] = await createTestProperty(supportClient, organization, { map: buildingMapJson })

            return result
        },

        async 'keystone:createUserWithOrganization' () {
            const result = await cypressMakeClientWithRegisteredOrganization()

            const client = await makeLoggedInClient(result.userAttrs)
            const cookie = client.getCookie()

            const organizationLink = await OrganizationEmployee.getOne(client, {
                user: { id: result.userAttrs.id }, isRejected: false, isBlocked: false,
            })
            const user = Object.assign({}, result.user)
            userObject = Object.assign({}, {
                user,
                cookie,
                organizationLinkId: organizationLink.id,
                userAttrs: result.userAttrs,
                organization: result.organization,
            })

            return userObject
        },
        
        async 'keystone:createTickets' (ticketAttrs, options = { regular: 1, emergency: 1, paid: 1, warranty: 1 }) {
            const client = await makeLoggedInClient(ticketAttrs.userAttrs)

            const { regular, emergency, paid, warranty } = options

            const regularTickets = range(regular).map(async () => await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property) )
            const emergencyTickets = range(emergency).map(async () => await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isEmergency: true }) )
            const paidTickets = range(paid).map(async () => await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isPaid: true }) )
            const warrantyTickets = range(warranty).map(async () => await createTestTicket(client, ticketAttrs.organization, ticketAttrs.property, { isWarranty: true }) )

            return await Promise.all([...regularTickets, ...emergencyTickets, ...paidTickets, ...warrantyTickets])
        },

        async 'keystone:createSupportWithProperty' () {
            if (isEmpty(supportObject)) {
                const client = await cypressMakeClientWithRegisteredOrganization()
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
    })

    on('after:run', async (results) => {
        console.log('[keystone.js] Launching cleanup...')

        console.log('[keystone.js] Users to reset:')
        console.log(createdUsers)
        await Promise.all(createdUsers.map(async id => await resetUser(supportClient, id)))
        console.log('[keystone.js] Users were reset.')

        console.log('[keystone.js] Organizations to reset:')
        console.log(createdOrganizations)
        await Promise.all(createdOrganizations.map(async id => await resetOrganization(supportClient, id)))
        console.log('[keystone.js] Organizations were reset.')
    })

    return config
}