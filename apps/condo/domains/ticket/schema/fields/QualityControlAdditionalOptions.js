const Ajv = require('ajv')
const { isEmpty, compact, isArray, uniq } = require('lodash')

const { Json } = require('@open-condo/keystone/fields')

const { getValidator, renderEnumOptions } = require('@condo/domains/common/schema/json.utils')
const { QUALITY_CONTROL_ADDITIONAL_OPTIONS } = require('@condo/domains/ticket/constants/qualityControl')


const ajv = new Ajv()

const QUALITY_CONTROL_ADDITIONAL_OPTIONS_ENUM = 'QualityControlAdditionalOptionsType'

const QUALITY_CONTROL_ADDITIONAL_OPTIONS_TYPES = `
    enum ${QUALITY_CONTROL_ADDITIONAL_OPTIONS_ENUM} {
        ${renderEnumOptions(QUALITY_CONTROL_ADDITIONAL_OPTIONS)}
    }
`

const QualityControlAdditionalOptionsSchema = {
    type: ['array', 'null'],
    uniqueItems: true,
    items: {
        enum: QUALITY_CONTROL_ADDITIONAL_OPTIONS,
    },
}

const qualityControlAdditionalOptionsValidator = getValidator(ajv.compile(QualityControlAdditionalOptionsSchema))

const QUALITY_CONTROL_ADDITIONAL_OPTIONS_FIELD = {
    schemaDoc: 'Quality control additional options that extend it.' +
        'Duplicates are removed and empty arrays are converted to null.',
    type: Json,
    isRequired: false,
    kmigratorOptions: { null: true },
    graphQLInputType: `[${QUALITY_CONTROL_ADDITIONAL_OPTIONS_ENUM}]`,
    graphQLReturnType: `[${QUALITY_CONTROL_ADDITIONAL_OPTIONS_ENUM}]`,
    extendGraphQLTypes: [QUALITY_CONTROL_ADDITIONAL_OPTIONS_TYPES],
    hooks: {
        validateInput: qualityControlAdditionalOptionsValidator,
        resolveInput: async ({ resolvedData, fieldPath }) => {
            const value = resolvedData[fieldPath]
            if (isArray(value)) {
                // NOTE: We clear the array of values from duplicates.
                // Also sort values and convert empty arrays to null to get rid of changes history problems
                const preparedValue = compact(uniq(value.sort()))
                return isEmpty(preparedValue) ? null : preparedValue
            }
            return value
        },
    },
}

module.exports = {
    QUALITY_CONTROL_ADDITIONAL_OPTIONS_FIELD,
}
