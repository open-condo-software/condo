/**
 * @jest-environment node
 */

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { MockSbbolResponses } = require('./MockSbbolResponses')
const { User: UserApi } = require('@condo/domains/user/utils/serverSchema')
const { OnBoarding: OnBoardingApi } = require('@condo/domains/onboarding/utils/serverSchema')
const { getItem, getItems } = require('@keystonejs/server-side-graphql-client')
const { makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')

const { syncUser } = require('./syncUser')

const index = require('@app/condo/index')
const { checkSbbolBankIntegrationContext } = require('@condo/domains/organization/integrations/sbbol/utils/checkSbbolBankIntegrationContext')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { BankIntegrationContext } = require('../../../../banking/utils/serverSchema')
const { dvSenderFields } = require('../constants')
const { BankIntegration, createTestBankIntegrationContext } = require('../../../../banking/utils/testSchema')
const { BANK_INTEGRATION_IDS } = require('../../../../banking/constants')
const { keystone } = index

let adminClient, adminContext, context, commonOrganization, bankIntegration, commonBankIntegrationContext, commonBankIntegrationContextAttrs


describe('syncBankAccount from SBBOL', () => {
    setFakeClientMode(index)
    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        adminContext = await keystone.createContext({ skipAccessControl: true })
        context = {
            keystone,
            context: adminContext,
        }
        const [organization] = await createTestOrganization(adminClient)
        commonOrganization = organization
        bankIntegration = await BankIntegration.getOne(adminClient, { id: BANK_INTEGRATION_IDS.SBBOL })
        const [obj, attrs] = await createTestBankIntegrationContext(adminClient, bankIntegration, organization)
        commonBankIntegrationContext = obj
        commonBankIntegrationContextAttrs = attrs
    })

    describe('checkSbbolBankIntegrationContext', async () => {
        it('checkSbbolBankIntegrationContext when instance of BankIntegrationContext not exist', async () => {
            const [organization] = await createTestOrganization(adminClient)

            const integrationContext = await checkSbbolBankIntegrationContext(adminContext, organization.id)

            expect(integrationContext.id).toBeDefined()
            expect(integrationContext.organization.id).toEqual(organization.id)
        })

        it('checkSbbolBankIntegrationContext when instance of BankIntegrationContext is exist', async () => {
            const integrationContext = await checkSbbolBankIntegrationContext(adminContext, commonOrganization.id)

            expect(integrationContext.id).toBeDefined()
            expect(integrationContext.organization.id).toEqual(commonOrganization.id)
        })
    })

    describe('syncBankAccounts', async () => {
        it('')
    })


})