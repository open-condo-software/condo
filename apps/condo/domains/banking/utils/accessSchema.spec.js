/**
 * @jest-environment node
 */
const index = require('@app/condo/index')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')


const { BankIntegrationAccessRight, createTestBankIntegrationOrganizationContext, BankIntegrationOrganizationContext } = require('@condo/domains/banking/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

const { BankIntegration, createTestBankIntegrationAccountContext } = require('./testSchema')

const { BANK_INTEGRATION_IDS } = require('../constants')

describe('checkBankIntegrationsAccessRights', () => {
    setFakeClientMode(index)
    let adminClient, serviceClient, bankIntegration
    jest.setTimeout(300000)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        serviceClient = await makeClientWithServiceUser()
        bankIntegration = await BankIntegration.getOne(adminClient, { id: BANK_INTEGRATION_IDS.SBBOL })
        const bankIntegrationAccessRight = await BankIntegrationAccessRight.create(adminClient, {
            user: { connect: { id: serviceClient.user.id } },
            integration: { connect: { id: bankIntegration.id } },
            dv: 1,
            sender: { dv: 1, fingerprint: 'tests' },
        })
    })

    it('Service user can create instances of banking entities and connect organization to them', async () => {
        const [organization] = await createTestOrganization(adminClient)

        await createTestBankIntegrationOrganizationContext(adminClient, bankIntegration, organization)

        const [bankIntegrationAccountContext] = await createTestBankIntegrationAccountContext(serviceClient, bankIntegration, organization)
        
        expect(bankIntegrationAccountContext).toBeDefined()
    })
})