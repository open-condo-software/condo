const Ajv = require('ajv')
const { Json } = require('@core/keystone/fields')

const { render, getValidator } = require('@condo/domains/billing/schema/fields/utils/json.utils')

const METER_READING_FILTERS_TYPE_NAME = 'MeterReadingFilters'

const MeterReadingFiltersFields = {
    address: '[String]',
    accountNumber: 'String',
    place: 'String',
    number: 'String',
    unitName: '[String]',
    resource: '[String]',
    clientName: 'String',
    createdAt: '[String]',
    date: '[String]',
    verificationDate: '[String]',
    installationDate: '[String]',
    commissioningDate: '[String]',
    sealingDate: '[String]',
    controlReadingDate: '[String]',
}

const METER_READING_FILTERS_TYPE = `
    type ${METER_READING_FILTERS_TYPE_NAME} {
        ${render(MeterReadingFiltersFields)}
    }
`

const getMeterReadingFiltersSchemaValueType = value => value.startsWith('[') ? { type: 'array', items: { type: 'string' } } : { type: 'string' }

const MeterReadingFiltersSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(MeterReadingFiltersFields).map((field) => ({ [field]: { ...getMeterReadingFiltersSchemaValueType(MeterReadingFiltersFields[field]) } })),
    ),
    additionalProperties: false,
}

const ajv = new Ajv()
const MeterReadingFiltersValidator = ajv.compile(MeterReadingFiltersSchema)

const validateMeterReadingFilters = getValidator(MeterReadingFiltersValidator)

const METER_READING_FILTERS_FIELD = {
    schemaDoc: 'Filters that match the given template',
    type: Json,
    extendGraphQLTypes: [METER_READING_FILTERS_TYPE],
    graphQLReturnType: METER_READING_FILTERS_TYPE_NAME,
    isRequired: true,
    hooks: {
        validateInput: validateMeterReadingFilters,
    },
}

module.exports = {
    METER_READING_FILTERS_FIELD,
}