/**
 * @jest-environment node
 */


const path = require('path')

const index = require('@app/condo/index')
const dayjs = require('dayjs')
const faker = require('faker')
const { pick } = require('lodash')

const conf = require('@open-condo/config')
const {
    UUID_RE,
    makeLoggedInAdminClient,
    setFakeClientMode,
    UploadingFile, catchErrorFrom,
} = require('@open-condo/keystone/test.utils')

const { importBankTransactionsWorker } = require('@condo/domains/banking/tasks/importBankTransactions')
const {
    BankIntegration,
    createTestBankIntegrationContext,
    createTestBankAccount,
} = require('@condo/domains/banking/utils/testSchema')
const { PARSED_TRANSACTIONS_TO_COMPARE } = require('@condo/domains/banking/utils/testSchema/assets/1CClientBankExchangeToKeystoneObjects')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')

const { BANK_INTEGRATION_IDS } = require('../constants')

const pathToCorrectFile = path.resolve(conf.PROJECT_ROOT, 'apps/condo/domains/banking/utils/testSchema/assets/1CClientBankExchange.txt')
const pathToInvalidFile = path.resolve(conf.PROJECT_ROOT, 'apps/condo/domains/banking/utils/testSchema/assets/1CClientBankExchange-Invalid.txt')

// Since 'importBankTransactions' task will be launched in afterChange hook of BankSyncTask,
// we will get extra unnecessary execution that will prevent us to test worker-function directly
const mockBankSyncTaskUtilsFor = (task) => ({
    update: jest.fn((context, id, attrs) => Object.assign(task, attrs)),
    getOne: jest.fn(() => task),
    gql: {
        SINGULAR_FORM: 'TestBankSyncTask',
    },
})

const expectCorrectBankTransaction = (obj, transactionDataToCompare, organization, bankAccount) => {
    expect(obj.id).toMatch(UUID_RE)
    expect(obj.dv).toEqual(1)
    expect(obj.sender).toMatchObject({ dv: 1, fingerprint: 'importBankTransactions' })
    expect(parseFloat(obj.amount)).toBeCloseTo(parseFloat(transactionDataToCompare.amount), 2)
    expect(obj.date).toEqual(dayjs(transactionDataToCompare.date).format('YYYY-MM-DD'))
    expect(obj).toMatchObject(pick(transactionDataToCompare, ['number', 'isOutcome', 'purpose', 'currencyCode']))
    expect(obj.importId).toEqual(transactionDataToCompare.number)
    expect(obj.importRemoteSystem).toEqual('1CClientBankExchange')
    expect(obj.organization.id).toEqual(organization.id)
    expect(obj.account.id).toEqual(bankAccount.id)
    expect(obj.integrationContext.id).toEqual(bankAccount.integrationContext.id)
}

let adminClient

describe('importBankTransactionsWorker', () => {
    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    it('creates BankAccount, BankIntegrationContext, BankTransaction and BankContractorAccount records', async () => {
        const [organization] = await createTestOrganization(adminClient)

        const task = {
            id: faker.datatype.uuid(),
            status: 'processing',
            file: new UploadingFile(pathToCorrectFile),
            organization,
        }

        const bankSyncTaskUtilsMock = mockBankSyncTaskUtilsFor(task)

        const { account: createdBankAccount, transactions } = await importBankTransactionsWorker(task.id, bankSyncTaskUtilsMock)

        expect(createdBankAccount).toBeDefined()
        expect(createdBankAccount.dv).toEqual(1)
        expect(createdBankAccount.sender).toMatchObject({ dv: 1, fingerprint: 'importBankTransactions' })
        expect(createdBankAccount.id).toMatch(UUID_RE)
        expect(createdBankAccount).toMatchObject({
            number: '40702810801500116391',
            routingNumber: '044525999',
            meta: {
                amount: '135394.23',
                '1CClientBankExchange': {
                    'v': '1.03',
                    'data': {
                        'ДатаНачала': '01.04.2022',
                        'ДатаКонца': '27.10.2022',
                        'РасчСчет': '40702810801500116391',
                        'НачальныйОстаток': '8300.00',
                        'ВсегоПоступило': '2681831.46',
                        'ВсегоСписано': '2554737.23',
                        'КонечныйОстаток': '135394.23',
                    },
                },
            },
        })
        // TODO(antonal): Due to difference in time zone offset between localhost and CI/CD calendar days saved from dayjs objects to Keystone cannot be compared using hardcoded values
        // expect(dayjs(createdBankAccount.meta.amountAt, 'YYYY-MM-DD').diff(dayjs('2022-10-27', 'YYYY-MM-DD'), 'day')).toEqual(0)

        expect(transactions).toHaveLength(4)
        expectCorrectBankTransaction(transactions[0], PARSED_TRANSACTIONS_TO_COMPARE[0], organization, createdBankAccount)
        expectCorrectBankTransaction(transactions[1], PARSED_TRANSACTIONS_TO_COMPARE[1], organization, createdBankAccount)
        expectCorrectBankTransaction(transactions[2], PARSED_TRANSACTIONS_TO_COMPARE[2], organization, createdBankAccount)
        expectCorrectBankTransaction(transactions[3], PARSED_TRANSACTIONS_TO_COMPARE[3], organization, createdBankAccount)
    })

    it('creates BankIntegrationContext for existing BankAccount, that does not have it', async () => {
        const [organization] = await createTestOrganization(adminClient)
        const [existingBankAccount] = await createTestBankAccount(adminClient, organization, {
            number: '40702810801500116391',
            routingNumber: '044525999',
        })

        const task = {
            id: faker.datatype.uuid(),
            status: 'processing',
            file: new UploadingFile(pathToCorrectFile),
            organization,
        }
        const bankSyncTaskUtilsMock = mockBankSyncTaskUtilsFor(task)

        const {
            account: reusedBankAccount,
            transactions,
        } = await importBankTransactionsWorker(task.id, bankSyncTaskUtilsMock)

        expect(reusedBankAccount.id).toEqual(existingBankAccount.id)

        expect(reusedBankAccount.integrationContext).toBeDefined()
        expect(reusedBankAccount.integrationContext.id).toMatch(UUID_RE)
        expect(reusedBankAccount.integrationContext.integration).toBeDefined()
        expect(reusedBankAccount.integrationContext.integration.id).toEqual(BANK_INTEGRATION_IDS['1CClientBankExchange'])
        expect(transactions).toHaveLength(4)
    })

    it('reuses existing BankAccount and BankIntegrationContext when it has the same integration', async () => {
        const [organization] = await createTestOrganization(adminClient)
        const bankIntegration = await BankIntegration.getOne(adminClient, { id: BANK_INTEGRATION_IDS['1CClientBankExchange'] })
        const [bankIntegrationContext] = await createTestBankIntegrationContext(adminClient, bankIntegration, organization)
        const [existingBankAccount] = await createTestBankAccount(adminClient, organization, {
            number: '40702810801500116391',
            routingNumber: '044525999',
            integrationContext: { connect: { id: bankIntegrationContext.id } },
        })

        const task = {
            id: faker.datatype.uuid(),
            status: 'processing',
            file: new UploadingFile(pathToCorrectFile),
            organization,
        }
        const bankSyncTaskUtilsMock = mockBankSyncTaskUtilsFor(task)

        const {
            account: reusedBankAccount,
            transactions,
        } = await importBankTransactionsWorker(task.id, bankSyncTaskUtilsMock)

        expect(reusedBankAccount).toBeDefined()
        expect(reusedBankAccount.id).toEqual(existingBankAccount.id)
        expect(reusedBankAccount).toMatchObject({
            number: '40702810801500116391',
            routingNumber: '044525999',
            integrationContext: {
                id: bankIntegrationContext.id,
            },
            meta: {
                amount: '135394.23',
            },
        })
        // TODO(antonal): Due to difference in time zone offset between localhost and CI/CD calendar days saved from dayjs objects to Keystone cannot be compared using hardcoded values
        // expect(dayjs(reusedBankAccount.meta.amountAt, 'YYYY-MM-DD').diff(dayjs('2022-10-27', 'YYYY-MM-DD'), 'day')).toEqual(0)

        expect(transactions).toHaveLength(4)
        expectCorrectBankTransaction(transactions[0], PARSED_TRANSACTIONS_TO_COMPARE[0], organization, existingBankAccount)
        expectCorrectBankTransaction(transactions[1], PARSED_TRANSACTIONS_TO_COMPARE[1], organization, existingBankAccount)
        expectCorrectBankTransaction(transactions[2], PARSED_TRANSACTIONS_TO_COMPARE[2], organization, existingBankAccount)
        expectCorrectBankTransaction(transactions[3], PARSED_TRANSACTIONS_TO_COMPARE[3], organization, existingBankAccount)
    })

    it('skips duplicated BankTransaction records by (number, date) uniqueness rule', async () => {
        const [organization] = await createTestOrganization(adminClient)

        const task1 = {
            id: faker.datatype.uuid(),
            status: 'processing',
            file: new UploadingFile(pathToCorrectFile),
            organization,
        }
        const bankSyncTaskUtilsMock1 = mockBankSyncTaskUtilsFor(task1)

        const { account: createdBankAccount, transactions } = await importBankTransactionsWorker(task1.id, bankSyncTaskUtilsMock1)
        expect(createdBankAccount).toBeDefined()
        expect(transactions).toHaveLength(4)

        const task2 = {
            id: faker.datatype.uuid(),
            status: 'processing',
            file: new UploadingFile(pathToCorrectFile),
            organization,
        }
        const bankSyncTaskUtilsMock2 = mockBankSyncTaskUtilsFor(task2)

        const { transactions: createdTransactions } = await importBankTransactionsWorker(task2.id, bankSyncTaskUtilsMock2)

        expect(createdTransactions).toHaveLength(0)

        expect(task2.meta).toMatchObject({
            duplicatedTransactions: ['61298', '6032', '656731', '239'],
        })
    })

    it('throws error when another integration of different type exist', async () => {
        const [organization] = await createTestOrganization(adminClient)
        const bankIntegration = await BankIntegration.getOne(adminClient, { id: BANK_INTEGRATION_IDS.SBBOL })
        const [bankIntegrationContext] = await createTestBankIntegrationContext(adminClient, bankIntegration, organization)
        await createTestBankAccount(adminClient, organization, {
            number: '40702810801500116391',
            routingNumber: '044525999',
            integrationContext: { connect: { id: bankIntegrationContext.id } },
        })

        const task = {
            id: faker.datatype.uuid(),
            status: 'processing',
            file: new UploadingFile(pathToCorrectFile),
            organization,
        }
        const bankSyncTaskUtilsMock = mockBankSyncTaskUtilsFor(task)


        await catchErrorFrom(async () => {
            await importBankTransactionsWorker(task.id, bankSyncTaskUtilsMock)
        }, ({ message }) => {
            expect(message).toEqual('Another integration is used for this bank account, that fetches transactions in a different way. You cannot import transactions from file in this case')
        })
    })

    it('throws INVALID_FILE_FORMAT error in case of file parsing error', async () => {
        const [organization] = await createTestOrganization(adminClient)

        const task = {
            id: faker.datatype.uuid(),
            status: 'processing',
            file: new UploadingFile(pathToInvalidFile),
            organization,
        }
        const bankSyncTaskUtilsMock = mockBankSyncTaskUtilsFor(task)

        await catchErrorFrom(async () => {
            await importBankTransactionsWorker(task.id, bankSyncTaskUtilsMock)
        }, ({ message }) => {
            expect(message).toEqual('Cannot parse uploaded file in 1CClientBankExchange format. Error: Invalid node "СекцияРасчСчет" at line 14')
        })
    })
})