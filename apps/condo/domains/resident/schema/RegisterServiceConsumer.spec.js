const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const express = require('express')

const { expectToThrowGQLError, setFakeClientMode } = require('@open-condo/keystone/test.utils')
const { initTestExpressApp, getTestExpressApp } = require('@open-condo/keystone/test.utils')

const {
    ONLINE_INTERACTION_CHECK_ACCOUNT_NOT_FOUND_STATUS,
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
} = require('@condo/domains/billing/constants/onlineInteraction')
const {
    TestUtils,
    ResidentTestMixin,
} = require('@condo/domains/billing/utils/testSchema/testUtils')
const { ERRORS: { BILLING_ACCOUNT_NOT_FOUND } } = require('@condo/domains/resident/schema/RegisterServiceConsumerService')
const { registerServiceConsumerByTestClient } = require('@condo/domains/resident/utils/testSchema')

const CHECK_URL_PATH = '/check-account-number'

describe('BillingIntegration with online interaction', () => {

    let utils
    let baseUrl = ''

    setFakeClientMode(index, { excludeApps: [] })



    beforeAll(async () => {
        utils = new TestUtils([ResidentTestMixin])
        await utils.init()
        baseUrl = getTestExpressApp('OnlineInteraction').baseUrl + CHECK_URL_PATH
        await utils.updateBillingIntegration({ checkAccountNumberUrl: baseUrl })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })


})