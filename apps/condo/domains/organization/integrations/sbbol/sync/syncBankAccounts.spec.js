/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const get = require('lodash/get')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { BankAccount } = require('@condo/domains/banking/utils/testSchema')
const { createValidRuRoutingNumber, createValidRuNumber } = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { ISO_CODES_FOR_SBBOL } = require('@condo/domains/common/constants/currencies')
const { _syncBankAccounts } = require('@condo/domains/organization/integrations/sbbol/sync/syncBankAccounts')
const { createTestOrganization, Organization, generateTin } = require('@condo/domains/organization/utils/testSchema')

const { MockSbbolResponses } = require('./MockSbbolResponses')


const { dvSenderFields } = require('../constants')

const { keystone } = index

let adminClient, adminContext, context, commonOrganization

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
        commonOrganization = await Organization.update(adminClient, createdOrganization.id, { tin: generateTin(RUSSIA_COUNTRY).toString(), ...dvSenderFields })
    })

    describe('syncBankAccounts', () => {
        let accountNumber1, accountNumber2, accountNumber3, routingNumber
        beforeAll(async () => {
            routingNumber = createValidRuRoutingNumber()
            accountNumber1 = createValidRuNumber(routingNumber)
            accountNumber2 = createValidRuNumber(routingNumber)
            accountNumber3 = createValidRuNumber(routingNumber)
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

            await _syncBankAccounts(accounts, commonOrganization)

            const foundAccounts = await BankAccount.getAll(adminClient, {
                number_in: [accountNumber1, accountNumber2],
            })

            expect(foundAccounts).toHaveLength(2)
        })

        it('Connects integration context to existing BankAccount when it does not have any of them', async () => {
            const [account] = get(MockSbbolResponses.getClientInfo(
                commonOrganization.tin,
                accountNumber3,
                '',
                routingNumber,
            ), 'accounts')

            await BankAccount.create(adminClient, {
                organization: { connect: { id: commonOrganization.id } },
                tin: commonOrganization.tin,
                country: RUSSIA_COUNTRY,
                number: account.number,
                currencyCode: (ISO_CODES_FOR_SBBOL[account.currencyCode]),
                routingNumber: account.bic,
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                isApproved: false,
            })

            await _syncBankAccounts([account], commonOrganization)

            const foundAccount = await BankAccount.getAll(adminClient, {
                number: accountNumber3,
            })

            expect(get(foundAccount[0], 'integrationContext.id')).toBeDefined()
        })

    })


})