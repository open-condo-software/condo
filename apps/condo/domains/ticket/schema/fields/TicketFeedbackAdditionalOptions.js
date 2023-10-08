const Ajv = require('ajv')
const { isEmpty, compact, isArray, uniq } = require('lodash')

const { Json } = require('@open-condo/keystone/fields')

const { getValidator, renderEnumOptions } = require('@condo/domains/common/schema/json.utils')
const { FEEDBACK_ADDITIONAL_OPTIONS } = require('@condo/domains/ticket/constants/feedback')


const ajv = new Ajv()

const FEEDBACK_ADDITIONAL_OPTIONS_ENUM = 'FeedbackAdditionalOptionsType'

const FEEDBACK_ADDITIONAL_OPTIONS_TYPES = `
    enum ${FEEDBACK_ADDITIONAL_OPTIONS_ENUM} {
        ${renderEnumOptions(FEEDBACK_ADDITIONAL_OPTIONS)}
    }
`

const FeedbackAdditionalOptionsSchema = {
    type: ['array', 'null'],
    uniqueItems: true,
    items: {
        enum: FEEDBACK_ADDITIONAL_OPTIONS,
    },
}

const feedbackAdditionalOptionsValidator = getValidator(ajv.compile(FeedbackAdditionalOptionsSchema))

const FEEDBACK_ADDITIONAL_OPTIONS_FIELD = {
    schemaDoc: 'Feedback additional options that extend it.' +
        'Duplicates are removed and empty arrays are converted to null.',
    type: Json,
    isRequired: false,
    kmigratorOptions: { null: true },
    graphQLInputType: `[${FEEDBACK_ADDITIONAL_OPTIONS_ENUM}]`,
    graphQLReturnType: `[${FEEDBACK_ADDITIONAL_OPTIONS_ENUM}]`,
    extendGraphQLTypes: [FEEDBACK_ADDITIONAL_OPTIONS_TYPES],
    hooks: {
        validateInput: feedbackAdditionalOptionsValidator,
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
    FEEDBACK_ADDITIONAL_OPTIONS_FIELD,
}
