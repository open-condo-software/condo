const Ajv = require('ajv')

const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const METER_READING_FILTER_TYPE_NAME = 'MeterReadingFilters'

const MeterReadingFilterFields = {
    organization: '[String]',
    address: '[String]',
    accountNumber: 'String',
    place: '[String]',
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
    controlReadingsDate: '[String]',
}

const METER_READING_FILTER_TYPE = `
    type ${METER_READING_FILTER_TYPE_NAME} {
        ${render(MeterReadingFilterFields)}
    }
`

const getMeterReadingFilterSchemaValueType = value => value.startsWith('[') ? { type: 'array', items: { type: 'string' } } : { type: 'string' }

const MeterReadingFilterSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(MeterReadingFilterFields).map((field) => ({ [field]: { ...getMeterReadingFilterSchemaValueType(MeterReadingFilterFields[field]) } })),
    ),
    additionalProperties: false,
}

const ajv = new Ajv()
const MeterReadingFilterValidator = ajv.compile(MeterReadingFilterSchema)

const validateMeterReadingFilter = getValidator(MeterReadingFilterValidator)

const METER_READING_FILTER_FIELD = {
    schemaDoc: 'Filter that match the given template',
    type: 'Json',
    extendGraphQLTypes: [METER_READING_FILTER_TYPE],
    graphQLReturnType: METER_READING_FILTER_TYPE_NAME,
    isRequired: true,
    hooks: {
        validateInput: validateMeterReadingFilter,
    },
}

module.exports = {
    METER_READING_FILTER_FIELD,
}
