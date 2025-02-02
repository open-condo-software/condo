/**
 * Generated by `createschema banking.BankCategory 'name:Text;'`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */

const { generateServerUtils, execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')

const { CREATE_BANK_ACCOUNT_REQUEST_MUTATION } = require('@condo/domains/banking/gql')
const { PREDICT_TRANSACTION_CLASSIFICATION_QUERY } = require('@condo/domains/banking/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const BankAccount = generateServerUtils('BankAccount')
const BankCategory = generateServerUtils('BankCategory')
const BankCostItem = generateServerUtils('BankCostItem')
const BankContractorAccount = generateServerUtils('BankContractorAccount')
const BankIntegration = generateServerUtils('BankIntegration')
const BankIntegrationAccountContext = generateServerUtils('BankIntegrationAccountContext')
const BankIntegrationOrganizationContext = generateServerUtils('BankIntegrationOrganizationContext')
const BankTransaction = generateServerUtils('BankTransaction')
const BankSyncTask = generateServerUtils('BankSyncTask')
const BankAccountReport = generateServerUtils('BankAccountReport')
const BankAccountReportTask = generateServerUtils('BankAccountReportTask')

async function createBankAccountRequest (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')

    return await execGqlWithoutAccess(context, {
        query: CREATE_BANK_ACCOUNT_REQUEST_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to createBankAccountRequest',
        dataPath: 'obj',
    })
}

const BankIntegrationAccessRight = generateServerUtils('BankIntegrationAccessRight')
async function predictTransactionClassification (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')

    return await execGqlWithoutAccess(context, {
        query: PREDICT_TRANSACTION_CLASSIFICATION_QUERY,
        variables: { data },
        errorMessage: '[error] Unable to predictTransactionClassification',
        dataPath: 'result',
    })
}

/* AUTOGENERATE MARKER <CONST> */

module.exports = {
    BankAccount,
    BankCategory,
    BankCostItem,
    BankContractorAccount,
    BankIntegration,
    BankIntegrationAccessRight,
    BankIntegrationAccountContext,
    BankIntegrationOrganizationContext,
    BankTransaction,
    BankSyncTask,
    BankAccountReport,
    createBankAccountRequest,
    predictTransactionClassification,
    BankAccountReportTask,
/* AUTOGENERATE MARKER <EXPORTS> */
}
