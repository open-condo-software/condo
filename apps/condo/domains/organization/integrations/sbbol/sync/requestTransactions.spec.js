/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const dayjs = require('dayjs')
const get = require('lodash/get')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { BANK_INTEGRATION_IDS } = require('@condo/domains/banking/constants')
const { BankAccount, BankIntegrationAccountContext, BankIntegration } = require('@condo/domains/banking/utils/testSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { requestTransactions } = require('@condo/domains/organization/integrations/sbbol/sync/requestTransactions')
const { createTestOrganization, Organization, generateTin } = require('@condo/domains/organization/utils/testSchema')
const { makeLoggedInClient } = require('@condo/domains/user/utils/testSchema')

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
                this.requestCount++
                return Promise.resolve({ error: { cause: 'STATEMENT_RESPONSE_PROCESSING' }, statusCode: 202 })
            } else {
                this.requestCount = 0
                return Promise.resolve({ data: { transactions: MockSbbolResponses.getStatementTransactions() }, statusCode: 200 })
            }
        }

        async getStatementSummary (accountNumber, statementDate, page = 1) {
            if ( (this.now < statementDate) || page === 2) {
                return Promise.resolve({ error: { cause: 'WORKFLOW_FAULT' }, statusCode: 400 })
            }
            if (this.requestCount === 0) {
                this.requestCount++
                return Promise.resolve({ error: { cause: 'STATEMENT_RESPONSE_PROCESSING' }, statusCode: 202 })
            } else {
                this.requestCount = 0
                return Promise.resolve({ data: MockSbbolResponses.getStatementSummary(), statusCode: 200 })
            }
        }
    }

    return {
        initSbbolFintechApi: jest.fn().mockImplementation( () => {
            return new SbbolFintechApi()
        }),
        initSbbolClientWithToken: jest.fn().mockImplementation( () => {
            return new SbbolFintechApi()
        }),
        SbbolFintechApi,
    }
})

jest.mock('@condo/domains/organization/integrations/sbbol/utils/getAccessTokenForUser',  () => {
    return {
        getAllAccessTokensByOrganization: jest.fn().mockImplementation( () => {
            return []
        }),
    }
})

describe('syncBankTransaction from SBBOL', () => {
    setFakeClientMode(index)
    jest.setTimeout(60000)
    let adminClient, commonClient, adminContext, context, commonOrganization, commonBankAccount
    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        commonClient = await makeLoggedInClient()
        adminContext = await keystone.createContext({ skipAccessControl: true })
        context = {
            keystone,
            context: adminContext,
        }
        const [createdOrganization] = await createTestOrganization(adminClient)
        commonOrganization = await Organization.update(adminClient, createdOrganization.id, { tin: generateTin(RUSSIA_COUNTRY).toString(), ...dvSenderFields })
        const bankIntegration = await BankIntegration.getOne(adminClient, { id: BANK_INTEGRATION_IDS.SBBOL })
        const bankIntegrationAccountContext = await BankIntegrationAccountContext.create(adminClient, {
            dv: 1,
            sender: { dv: 1, fingerprint: 'tests' },
            integration: { connect: { id: bankIntegration.id } },
            organization: { connect: { id: commonOrganization.id } },
        })
        commonBankAccount = await BankAccount.create(adminClient, {
            tin: commonOrganization.tin,
            country: RUSSIA_COUNTRY,
            number: '40702810638155352218',
            currencyCode: 'RUB',
            routingNumber: '044525225',
            organization: { connect: { id: commonOrganization.id } },
            integrationContext: { connect: { id: bankIntegrationAccountContext.id } },
            meta: {
                sbbol: {
                    type: 'test',
                },
            },
            ...dvSenderFields,
        })

    })

    describe('requestTransactions', () => {
        it('Request transactions from SBBOL', async () => {
            const transactions = await requestTransactions({
                dateInterval: [dayjs().format('YYYY-MM-DD')],
                userId: commonClient.user.id,
                organization: commonOrganization,
            })

            const bankAccountBalance = await BankIntegrationAccountContext.getOne(adminClient, { id: commonBankAccount.integrationContext.id })
            expect(get(bankAccountBalance, 'meta.amount')).toBeDefined()
            expect(get(bankAccountBalance, 'meta.amountAt')).toBeDefined()
            expect(transactions[0]).toHaveLength(5)
        })

        it('Expect an error if trying to get a statement for a future date', async () => {
            let error

            try {
                await requestTransactions({
                    dateInterval:  [dayjs().add(7, 'day').format('YYYY-MM-DD')],
                    userId: commonClient.user.id,
                    organization: commonOrganization,
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
                    dateInterval:  ['h3ge4jh32'],
                    userId: commonClient.user.id,
                    organization: commonOrganization,
                })
            } catch (e) {
                error = e.message
            }

            expect(error).toMatch(INVALID_DATE_RECEIVED_MESSAGE)
        })

        it('Request transactions from SBBOL for a period', async () => {
            const dateEnd = dayjs().format('YYYY-MM-DD')
            const dateInterval = [dateEnd]
            for (let i = 1; i <= 3; i++) {
                dateInterval.push(dayjs(dateInterval[dateInterval.length - 1]).subtract(1, 'day').format('YYYY-MM-DD'))
            }
            const transactions = await requestTransactions({
                dateInterval,
                userId: commonClient.user.id,
                organization: commonOrganization,
            })
            expect(transactions).toHaveLength(4)
        })
    })

})