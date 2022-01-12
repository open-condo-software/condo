const Ajv = require('ajv')

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

const CUSTOM_FIELD_TYPES = ['AdvanceAcceptanceBundle']

const renderFieldType = (typename, isInput) => {
    // '[ExampleType]' -> 'ExampleType', 'ExampleType!' -> 'ExampleType', etc.
    const typeWithoutModifiers = typename.match(/(\w+)/)[0]
    return isInput && CUSTOM_FIELD_TYPES.includes(typeWithoutModifiers)
        ? // 'ExampleType' -> 'ExampleTypeInput', '[ExampleType]' -> '[ExampleTypeInput]', etc.
          typename.replace(/(\w+)/, '$1Input')
        : typename
}

const render = (fields, isInput) =>
    Object.keys(fields).reduce(
        (acc, key) => acc + `${key}: ${isInput ? renderFieldType(fields[key], isInput) : fields[key]}\n`,
        '',
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
    
    type SbbolOfferAccept {
        dv: Int
        ${render(AdvanceAcceptanceField)}
    }
    
    input SbbolOfferAcceptInput {
        dv: Int!
        ${render(AdvanceAcceptanceField, true)}
    }
`

const sbbolOfferAcceptFieldSchema = {
    properties: Object.assign({}, ...Object.keys(AdvanceAcceptanceField).map((x) => ({ [x]: { type: ['string', 'null'] } })), {
        dv: {
            type: 'integer',
        },
        active: {
            type: ['boolean', 'null'],
        },
        bundles: {
            type: ['array', 'null'],
            items: {
                type: 'object',
                properties: Object.assign(
                    {},
                    ...Object.keys(AdvanceAcceptanceBundleField).map((x) => ({ [x]: { type: ['string', 'null'] } })),
                    {
                        currentState: {
                            type: ['string', 'null'],
                            enum: ['ACTIVE', 'NOT_PAID', 'DEACTIVATED'],
                        },
                    },
                ),
            },
        },
    }),
}

const ajv = new Ajv()
const sbbolOfferAcceptJsonValidator = ajv.compile(sbbolOfferAcceptFieldSchema)

const ADVANCE_ACCEPTABLE_BUNDLE_QUERY_LIST = 'code name sinceDate untilDate currentState'

const ADVANCE_ACCEPTABLE_QUERY_LIST = `active payerAccount payerBankBic payerBankCorrAccount payerInn payerName payerOrgIdHash purpose sinceDate untilDate bundles { ${ADVANCE_ACCEPTABLE_BUNDLE_QUERY_LIST} }`

const SBBOL_OFFER_ACCEPT_FIELD_QUERY_LIST = `dv ${ADVANCE_ACCEPTABLE_QUERY_LIST}`

module.exports = {
    SBBOL_OFFER_ACCEPT_GRAPHQL_TYPES,
    sbbolOfferAcceptJsonValidator,
    SBBOL_OFFER_ACCEPT_FIELD_QUERY_LIST,
}
