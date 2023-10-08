const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const ajv = new Ajv()
addFormats(ajv)

const { EXPENSES_GROUPED_BY_CATEGORY_AND_COST_ITEM } = require('@condo/domains/banking/constants')

const bankAccountReportDataValidators = {
    [EXPENSES_GROUPED_BY_CATEGORY_AND_COST_ITEM]: ajv.compile({
        type: 'object',
        properties: {
            categoryGroups: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        name: {
                            type: 'string',
                        },
                        costItemGroups: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'string',
                                        format: 'uuid',
                                    },
                                    name: {
                                        type: 'string',
                                    },
                                    sum: {
                                        type: 'number',
                                    },
                                    isOutcome: {
                                        type: 'boolean',
                                    },
                                },
                                additionalProperties: false,
                                required: ['id', 'name', 'sum', 'isOutcome'],
                            },
                        },
                    },
                    additionalProperties: false,
                    required: ['id', 'name', 'costItemGroups'],
                },
                minItems: 0,
            },
        },
        additionalProperties: false,
    }),
}

module.exports = {
    bankAccountReportDataValidators,
}