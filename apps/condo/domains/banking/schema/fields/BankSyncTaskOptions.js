const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const { Json } = require('@open-condo/keystone/fields')

const { _1C_CLIENT_BANK_EXCHANGE, SBBOL } = require('@condo/domains/banking/constants')
const { getValidator, render } = require('@condo/domains/common/schema/json.utils')


const ajv = new Ajv()

const BANK_SYNC_TASK_OPTIONS_TYPE_NAME = 'BankSyncTaskOptions'
const BANK_SYNC_TASK_OPTIONS_INPUT_NAME = 'BankSyncTaskOptionsInput'

const bankSyncTaskOptionsFields = {
    type: 'String',
    dateFrom: 'String',
    dateTo: 'String',
}

const BANK_SYNC_TASK_OPTIONS_TYPES = `
    type ${BANK_SYNC_TASK_OPTIONS_TYPE_NAME} {
        ${render(bankSyncTaskOptionsFields)}
    }
    
    input ${BANK_SYNC_TASK_OPTIONS_INPUT_NAME} {
        ${render(bankSyncTaskOptionsFields)}
    }
`

const bankSyncTaskOptionsSchema = {
    type: 'object',
    properties: {
        type: { type: 'string', enum: [SBBOL, _1C_CLIENT_BANK_EXCHANGE] },
        dateFrom: { type: 'string', format: 'date' },
        dateTo: { type: 'string', format: 'date' },
    },
    required: ['type'],
    additionalProperties: false,
}
addFormats(ajv)
const bankSyncTaskOptionValidator = getValidator(ajv.compile(bankSyncTaskOptionsSchema))

const BANK_SYNC_TASK_OPTIONS = {
    schemaDoc: 'Options for launching tasks for banking domain',
    type: Json,
    graphQLInputType: BANK_SYNC_TASK_OPTIONS_INPUT_NAME,
    graphQLReturnType: BANK_SYNC_TASK_OPTIONS_TYPE_NAME,
    extendGraphQLTypes: [BANK_SYNC_TASK_OPTIONS_TYPES],
    hooks: {
        validateInput: bankSyncTaskOptionValidator,
    },
    access: {
        read: true,
        create: true,
        update: false,
    },
}

module.exports = {
    BANK_SYNC_TASK_OPTIONS,
}
