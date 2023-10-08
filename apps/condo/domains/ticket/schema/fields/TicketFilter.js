const Ajv = require('ajv')
const { get, isUndefined } = require('lodash')

const { Json } = require('@open-condo/keystone/fields')

const { render, getValidator } = require('@condo/domains/common/schema/json.utils')

const TICKET_FILTER_TYPE_NAME = 'TicketFilter'

const TicketFilterFields = {
    organization: '[String]',
    number: 'Int',
    createdAt: '[String]',
    status: '[String]',
    details: 'String',
    property: '[String]',
    propertyScope: '[String]',
    address: 'String',
    clientName: 'String',
    executor: '[String]',
    assignee: '[String]',
    executorName: 'String',
    deadline: '[String]',
    assigneeName: 'String',
    attributes: '[String]',
    source: '[String]',
    sectionName: '[String]',
    floorName: '[String]',
    unitType: '[String]',
    unitName: '[String]',
    placeClassifier: '[String]',
    categoryClassifier: '[String]',
    problemClassifier: '[String]',
    clientPhone: '[String]',
    createdBy: '[String]',
    // TODO(DOMA-5833): should remove "reviewValue" soon
    reviewValue: '[String]',
    feedbackValue: '[String]',
    qualityControlValue: '[String]',
    contactIsNull: '[String]',
    completedAt: '[String]',
    lastCommentAt: '[String]',
    type: 'String',
}

const TICKET_FILTER_TYPE = `
    type ${TICKET_FILTER_TYPE_NAME} {
        ${render(TicketFilterFields)}
    }
`

const getTicketFilterSchemaValueType = value => value.startsWith('[') ? { type: 'array', items: { type: 'string' } } : { type: 'string' }

const TicketFilterSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(TicketFilterFields).map((field) => ({ [field]: { ...getTicketFilterSchemaValueType(TicketFilterFields[field]) } })),
    ),
    additionalProperties: false,
}

const ajv = new Ajv()
const TicketFilterValidator = ajv.compile(TicketFilterSchema)

const validateTicketFilter = getValidator(TicketFilterValidator)

const TICKET_FILTER_FIELD = {
    schemaDoc: 'Filter that match the given template',
    type: Json,
    extendGraphQLTypes: [TICKET_FILTER_TYPE],
    graphQLReturnType: TICKET_FILTER_TYPE_NAME,
    isRequired: true,
    hooks: {
        validateInput: validateTicketFilter,
        resolveInput: async ({ resolvedData, fieldPath, existingItem }) => {
            // TODO(DOMA-5833): should remove this logic for override 'reviewValue' or 'feedbackValue'
            //  and drop 'reviewValue' from database soon

            const existingFields = get(existingItem, fieldPath, {}) || {}
            const fields = get(resolvedData, fieldPath, {}) || {}

            const existingFeedbackValue = get(existingFields, 'feedbackValue')
            const inputFeedbackValue = get(fields, 'feedbackValue')
            const existingReviewValue = get(existingFields, 'reviewValue')
            const inputReviewValue = get(fields, 'reviewValue')

            if (!isUndefined(inputFeedbackValue) && JSON.stringify(existingFeedbackValue) !== JSON.stringify(inputFeedbackValue)) {
                if (inputFeedbackValue) {
                    fields['reviewValue'] = fields['feedbackValue']
                } else {
                    delete fields['reviewValue']
                }
            } else if (!isUndefined(inputReviewValue) && JSON.stringify(existingReviewValue) !== JSON.stringify(inputReviewValue)) {
                if (inputReviewValue) {
                    fields['feedbackValue'] = fields['reviewValue']
                } else {
                    delete fields['feedbackValue']
                }
            }

            return fields
        },
    },
}

module.exports = {
    TICKET_FILTER_FIELD,
}