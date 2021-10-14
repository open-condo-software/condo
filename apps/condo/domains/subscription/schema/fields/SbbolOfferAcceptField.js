const Ajv = require('ajv')
const { Json } = require('@core/keystone/fields')

const AdvanceAcceptanceBundleField = {
    code: 'String',
    name: 'String',
    sinceDate: 'String',
    untilDate: 'String',
    currentState: 'CurrentStateType',
}

const AdvanceAcceptanceField = {
    active: 'Boolean',
    payerAccount: 'String',
    payerBankBic: 'String',
    payerBankCorrAccount: 'String',
    payerInn: 'String',
    payerName: 'String',
    payerOrgIdHash: 'String',
    purpose: 'String',
    sinceDate: 'String',
    untilDate: 'String',
    bundles: '[AdvanceAcceptanceBundle]',
}

const CUSTOM_FIELD_TYPES = [
    'AdvanceAcceptanceBundle',
]

const renderFieldType = (typename, isInput) => {
    // '[ExampleType]' -> 'ExampleType', 'ExampleType!' -> 'ExampleType', etc.
    const typeWithoutModifiers = typename.match(/(\w+)/)[0]
    return (
        isInput && CUSTOM_FIELD_TYPES.includes(typeWithoutModifiers)
            // 'ExampleType' -> 'ExampleTypeInput', '[ExampleType]' -> '[ExampleTypeInput]', etc.
            ? typename.replace(/(\w+)/, '$1Input')
            : typename
    )
}

const render = (fields, isInput) => (
    Object.keys(fields).reduce((acc, key) => (
        acc + `${key}: ${isInput ? renderFieldType(fields[key], isInput) : fields[key]}\n`
    ), '')
)

const SBBOL_OFFER_ACCEPT_GRAPHQL_TYPES = `
    enum CurrentStateType {
        ACTIVE
        NOT_PAID
        DEACTIVATED
    }

    type AdvanceAcceptanceBundle {
        ${render(AdvanceAcceptanceBundleField)}
    }
    
    input AdvanceAcceptanceBundleInput {
        ${render(AdvanceAcceptanceBundleField, true)}
    }
    
    type AdvanceAcceptance {
        ${render(AdvanceAcceptanceField)}
    }
    
    input AdvanceAcceptanceInput {
        ${render(AdvanceAcceptanceField, true)}
    }
    
    type SbbolOfferAccept {
        data: [AdvanceAcceptance]
    }
    
    input SbbolOfferAcceptInput {
        data: [AdvanceAcceptanceInput]
    }
`

const sbbolOfferAcceptFieldSchema = {
    type: 'object',
    properties: {
        data: {
            type: 'array',
            items: {
                type: 'object',
                properties: Object.assign({},
                    ...Object.keys(AdvanceAcceptanceField).map((x) => ({ [x]: { type: ['string', 'null'] } })),
                    {
                        active: {
                            type: ['boolean', 'null'],
                        },
                        bundles: {
                            type: ['array', 'null'],
                            items: {
                                type: 'object',
                                properties: Object.assign({},
                                    ...Object.keys(AdvanceAcceptanceBundleField).map((x) => ({ [x]: { type: ['string', 'null'] } })),
                                    {
                                        currentState: {
                                            type: ['string', 'null'],
                                            enum: [
                                                'ACTIVE',
                                                'NOT_PAID',
                                                'DEACTIVATED',
                                            ],
                                        },
                                    }
                                ),
                            },
                        },
                    }
                ),
            },
        },
    },
}

const ajv = new Ajv()
const sbbolOfferAcceptJsonValidator = ajv.compile(sbbolOfferAcceptFieldSchema)

const SBBOL_OFFER_ACCEPT_FIELD = {
    schemaDoc: 'It is necessary to save the offer confirmation data that is transmitted in the response of the advance-acceptances method',
    type: Json,
    extendGraphQLTypes: [SBBOL_OFFER_ACCEPT_GRAPHQL_TYPES],
    graphQLReturnType: 'SbbolOfferAccept',
    graphQLInputType: 'SbbolOfferAcceptInput',
    hooks: {
        validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
            if (!sbbolOfferAcceptJsonValidator(resolvedData[fieldPath])) {
                sbbolOfferAcceptJsonValidator.errors.forEach(error => {
                    addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
                })
            }
        },
    },
}

const ADVANCE_ACCEPTABLE_BUNDLE_QUERY_LIST = 'code name sinceDate untilDate currentState'

const ADVANCE_ACCEPTABLE_QUERY_LIST = `active payerAccount payerBankBic payerBankCorrAccount payerInn payerName payerOrgIdHash purpose sinceDate untilDate bundles { ${ADVANCE_ACCEPTABLE_BUNDLE_QUERY_LIST} }`

const SBBOL_OFFER_ACCEPT_FIELD_QUERY_LIST = `data { ${ADVANCE_ACCEPTABLE_QUERY_LIST} }`

module.exports = {
    SBBOL_OFFER_ACCEPT_FIELD,
    sbbolOfferAcceptJsonValidator,
    SBBOL_OFFER_ACCEPT_FIELD_QUERY_LIST,
}