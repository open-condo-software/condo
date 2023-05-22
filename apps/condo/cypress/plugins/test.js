/**
 * @type {Cypress.PluginConfig}
 */
const fs = require('fs')

const isEmpty = require('lodash/isEmpty')

const { resetOrganizationByTestClient } = require('@condo/domains/organization/utils/testSchema')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { buildingMapJson } = require('@condo/domains/property/constants/property')
const { makeClientWithProperty, createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket, createTestTicketClassifier } = require('@condo/domains/ticket/utils/testSchema')
const { resetUserByTestClient } = require('@condo/domains/user/utils/testSchema')
const {
    createTestUser,
    createTestForgotPasswordAction,
    ConfirmPhoneAction,
    makeLoggedInClient,
    makeClientWithSupportUser, updateTestUser,
} = require('@condo/domains/user/utils/testSchema')

let userObject = {}
let supportObject = {}

const createdUsers = []
const createdOrganizations = []

const resetUser = async (supportClient, id) => {
    const payload = { user: { id } }

    const [response] = await resetUserByTestClient(supportClient, payload)

    console.log(`[keystone.js] User with id: ${id} was reset: ${response}`)
}

const resetOrganization = async (supportClient, id) => {
    const payload = { organizationId: id }

    const [response] = await resetOrganizationByTestClient(supportClient, payload)

    console.log(`[keystone.js] Org with id: ${id} was reset: ${response}`)
}

const cypressCreateTestUser = async (supportClient) => {
    const createdUser = await createTestUser(supportClient)
    createdUsers.push([createdUser].id)
    return createdUser
}

const cypressMakeClientWithProperty = async (supportClient) => {
    const client = await makeClientWithProperty(supportClient)
    createdUsers.push(client.user.id)
    createdOrganizations.push(client.organization.id)
    return client
}

const cypressMakeClientWithRegisteredOrganization = async (supportClient) => {
    const client = await makeClientWithRegisteredOrganization(supportClient)
    createdUsers.push(client.user.id)
    createdOrganizations.push(client.organization.id)
    return client
}

module.exports = async (on, config) => {

    // const supportEmail = config.env.supportEmail
    // const supportPassword = config.env.supportPassword
    // if (!supportEmail || !supportPassword) {
    //     throw new Error('Please provide cypress with support credentials for correct user creation')
    // }
    //
    // const supportClient = await makeLoggedInClient({ email: supportEmail, password: supportPassword })
    //
    // const admin = null
    //
    // on('task', {})
    //
    // on('after:run', async (results) => {
    //     console.log('[test.js] Test!')
    // })
    //
    // return config
}