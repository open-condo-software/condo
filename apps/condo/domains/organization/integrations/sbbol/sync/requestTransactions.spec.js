/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const dayjs = require('dayjs')
const get = require('lodash/get')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { BANK_INTEGRATION_IDS } = require('@condo/domains/banking/constants')
const { BankIntegration, createTestBankIntegrationContext, BankAccount } = require('@condo/domains/banking/utils/testSchema')
const { createValidRuRoutingNumber, createValidRuNumber } = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { initSbbolFintechApi } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')
const { requestTransactions } = require('@condo/domains/organization/integrations/sbbol/sync/requestTransactions')
const { createTestOrganization, Organization, generateTin } = require('@condo/domains/organization/utils/testSchema')
const { makeLoggedInClient, User } = require('@condo/domains/user/utils/testSchema')

const { MockSbbolResponses } = require('./MockSbbolResponses')

const { dvSenderFields, INVALID_DATE_RECEIVED_MESSAGE, ERROR_PASSED_DATE_IN_THE_FUTURE } = require('../constants')

const { keystone } = index

jest.mock('@condo/domains/organization/integrations/sbbol/SbbolFintechApi',  () => {
    const dayjs = require('dayjs')
    class SbbolFintechApi {
        requestCount = 0
        now = dayjs().format('YYYY-MM-DD')

        async getStatementTransactions (accountNumber, statementDate, page = 1) {
            if ( (this.now < statementDate) || page === 2) {
                return Promise.resolve({ error: { cause: 'WORKFLOW_FAULT' }, statusCode: 400 })
            }
            if (this.requestCount === 0) {
                setTimeout(() => {
                    this.requestCount++
                }, 3000)
                return Promise.resolve({ error: { cause: 'STATEMENT_RESPONSE_PROCESSING' }, statusCode: 202 })
            } else {
                this.requestCount = 0
                return Promise.resolve({ data: { transactions: MockSbbolResponses.getStatementTransactions() }, statusCode: 200 })
            }
        }
    }

    return {
        initSbbolFintechApi: jest.fn().mockImplementation( () => {
            return new SbbolFintechApi()
        }),
        SbbolFintechApi,
    }
})

describe('syncBankAccount from SBBOL', () => {
    setFakeClientMode(index)

    let adminClient, commonClient, adminContext, context, commonOrganization, bankIntegration, commonBankIntegrationContext, commonBankIntegrationContextAttrs
    beforeAll(async () => {
        jest.setTimeout(300000)

        adminClient = await makeLoggedInAdminClient()
        commonClient = await makeLoggedInClient()
        adminContext = await keystone.createContext({ skipAccessControl: true })
        context = {
            keystone,
            context: adminContext,
        }
        const [createdOrganization] = await createTestOrganization(adminClient)
        commonOrganization = await Organization.update(adminClient, createdOrganization.id, { tin: generateTin(RUSSIA_COUNTRY).toString(), ...dvSenderFields })
        bankIntegration = await BankIntegration.getOne(adminClient, { id: BANK_INTEGRATION_IDS.SBBOL })
        const [obj, attrs] = await createTestBankIntegrationContext(adminClient, bankIntegration, commonOrganization)

        commonBankIntegrationContext = obj
        commonBankIntegrationContextAttrs = attrs
        const commonBankAccount = await BankAccount.create(adminClient, {
            tin: commonOrganization.tin,
            country: RUSSIA_COUNTRY,
            number: '40702810638155352218',
            currencyCode: 'RUB',
            routingNumber: '044525225',
            organization: { connect: { id: commonOrganization.id } },
            ...dvSenderFields,
        })

    })

    describe('requestTransactions', async () => {
        it('Request transactions from SBBOL ', async () => {
            const transactions = await requestTransactions({
                date: dayjs().format('YYYY-MM-DD'),
                userId: commonClient.user.id,
                organization: commonOrganization,
                bankIntegrationContextId: commonBankIntegrationContext.id,
            })

            expect(transactions).toHaveLength(10)
        })

        it('Expect an error if trying to get a statement for a future date', async () => {
            let error

            try {
                await requestTransactions({
                    date:  dayjs().add(7, 'day').format('YYYY-MM-DD'),
                    userId: commonClient.user.id,
                    organization: commonOrganization,
                    bankIntegrationContextId: commonBankIntegrationContext.id,
                })
            } catch (e) {
                error = e.message
            }

            expect(error).toEqual(ERROR_PASSED_DATE_IN_THE_FUTURE)
        })

        it('Expect an error if trying to pass an invalid date', async () => {
            let error

            try {
                await requestTransactions({
                    date:  'h3ge4jh32',
                    userId: commonClient.user.id,
                    organization: commonOrganization,
                    bankIntegrationContextId: commonBankIntegrationContext.id,
                })
            } catch (e) {
                error = e.message
            }

            expect(error).toMatch(INVALID_DATE_RECEIVED_MESSAGE)
        })
    })

})