/**
 * @jest-environment node
 */

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { MockSbbolResponses } = require('./MockSbbolResponses')

const index = require('@app/condo/index')
const { checkSbbolBankIntegrationContext } = require('@condo/domains/organization/integrations/sbbol/utils/checkSbbolBankIntegrationContext')
const { createTestOrganization, Organization, generateTin } = require('@condo/domains/organization/utils/testSchema')
const { dvSenderFields } = require('../constants')
const { BankIntegration, createTestBankIntegrationContext, BankAccount } = require('@condo/domains/banking/utils/testSchema')
const { BANK_INTEGRATION_IDS } = require('@condo/domains/banking/constants')
const { _syncBankAccounts } = require('@condo/domains/organization/integrations/sbbol/sync/syncBankAccounts')
const get = require('lodash/get')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { createValidRuRoutingNumber, createValidRuNumber } = require('@condo/domains/banking/utils/testSchema/bankAccount')
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
        const [createdOrganization] = await createTestOrganization(adminClient)
        commonOrganization = await Organization.update(adminClient, createdOrganization.id, { tin: generateTin(RUSSIA_COUNTRY).toString(), ...dvSenderFields})
        bankIntegration = await BankIntegration.getOne(adminClient, { id: BANK_INTEGRATION_IDS.SBBOL })
        const [obj, attrs] = await createTestBankIntegrationContext(adminClient, bankIntegration, commonOrganization)
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
        let accountNumber1, accountNumber2, routingNumber
        beforeAll(async () => {
            routingNumber = createValidRuRoutingNumber()
            accountNumber1 = createValidRuNumber(routingNumber)
            accountNumber2 = createValidRuNumber(routingNumber)
        })

        it('get accounts if they have not been created before', async () => {
            const accounts = get(MockSbbolResponses.getClientInfo(
                commonOrganization.tin,
                accountNumber1,
                accountNumber2,
                routingNumber,
            ), 'accounts')

            const accountsNotFound = await BankAccount.getAll(adminClient, {
                number_in: [accountNumber1, accountNumber2],
            })
            expect(accountsNotFound).toEqual([])

            await _syncBankAccounts(accounts, commonBankIntegrationContext.id, commonOrganization)

            const foundAccounts = await BankAccount.getAll(adminClient, {
                number_in: [accountNumber1, accountNumber2],
            })

            expect(foundAccounts).toHaveLength(2)
        })

    })


})