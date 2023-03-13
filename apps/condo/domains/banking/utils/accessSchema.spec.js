/**
 * @jest-environment node
 */
const index = require('@app/condo/index')

const { makeLoggedInAdminClient, catchErrorFrom, setFakeClientMode } = require('@open-condo/keystone/test.utils')


const { BankIntegrationAccessRight } = require('@condo/domains/banking/utils/testSchema')
const { createTestOrganization, Organization } = require('@condo/domains/organization/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

const { BankIntegration, createTestBankIntegrationContext } = require('./testSchema')

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

    it('Service user can', async () => {
        const [organization] = await createTestOrganization(adminClient)

        const bankIntegrationContext = await createTestBankIntegrationContext(serviceClient, bankIntegration, organization)
        
        expect(bankIntegrationContext).toBeDefined()
    })
    it('user can', async () => {
        const [organization] = await createTestOrganization(adminClient)

        const org = await Organization.getAll(serviceClient, {
            id: organization.id,
        })
        expect(org.length).toBeGreaterThanOrEqual(1)
    })
})