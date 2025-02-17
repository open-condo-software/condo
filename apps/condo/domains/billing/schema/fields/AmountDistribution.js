const Ajv = require('ajv')
const Big = require('big.js')
const { omit, get, set } = require('lodash')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')

const {
    AMOUNT_DISTRIBUTION_FIELD_NAME,
    AMOUNT_DISTRIBUTION_INPUT_NAME,
    AMOUNT_DISTRIBUTION_SCHEMA_FIELD,
    AMOUNT_DISTRIBUTION_SCHEMA_INPUT,
} = require('@condo/domains/acquiring/constants/gql')
const {
    RECIPIENT_FIELD_NAME,
    RECIPIENT_INPUT_NAME,
    RECIPIENT_FIELDS_DEFINITION,
    RecipientSchema,
} = require('@condo/domains/acquiring/schema/fields/Recipient')
const {
    hasOverpaymentReceivers,
    hasSingleVorItem,
    hasFeePayers,
} = require('@condo/domains/acquiring/utils/billingCentrifuge')
const {
    WRONG_AMOUNT_DISTRIBUTION_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NO_APPROVED_BANK_ACCOUNT_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_SUMS_NOT_MATCH_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NO_VOR_IN_GROUP_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NO_FEE_PAYER_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NO_OVERPAYMENT_RECEIVER_ERROR_TYPE,
} = require('@condo/domains/billing/constants/errors')
const { render, getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')

const DEFAULT_TO_PAY_FIELD_NAME = 'toPay'

const ERRORS = {
    NO_APPROVED_BANK_ACCOUNT: (notApprovedRecipients) => ({
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_NO_APPROVED_BANK_ACCOUNT_ERROR_TYPE,
        message: 'Some recipients not approved. Please connect to support.',
        messageInterpolation: { notApprovedRecipients },
    }),
    SUMS_NOT_MATCH: (toPay, distributionsSum) => ({
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_SUMS_NOT_MATCH_ERROR_TYPE,
        message: 'Total sum (toPay={toPay}) is not match to sum of distributions ({distributionsSum})',
        messageInterpolation: { toPay, distributionsSum },
    }),
    NO_VOR_IN_GROUP: (order) => ({
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_NO_VOR_IN_GROUP_ERROR_TYPE,
        message: 'Group {order} does not contains a SINGLE element with vor=true',
        messageInterpolation: { order },
    }),
    NO_FEE_PAYERS: {
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_NO_FEE_PAYER_ERROR_TYPE,
        message: 'The distribution does not contains at least one fee payer (isFeePayer=true)',
    },
    NO_OVERPAYMENT_RECEIVER: {
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_NO_OVERPAYMENT_RECEIVER_ERROR_TYPE,
        message: 'Distribution does not have at least one item with overpaymentPart value',
    },
}

function getFields (isInput = false) {
    return {
        recipient: `${isInput ? RECIPIENT_INPUT_NAME : RECIPIENT_FIELD_NAME}!`,
        amount: 'String!',
        order: 'Int',
        vor: 'Boolean',
        isFeePayer: 'Boolean',
        overpaymentPart: 'Int',
    }
}

const AMOUNT_DISTRIBUTION_GRAPHQL_TYPES = `
    type ${AMOUNT_DISTRIBUTION_FIELD_NAME} {
        ${render(getFields())}
    }
    
    input ${AMOUNT_DISTRIBUTION_INPUT_NAME} {
        ${render(getFields(true))}
    }
`

const AMOUNT_DISTRIBUTION_QUERY_LIST = `recipient { ${Object.keys(RECIPIENT_FIELDS_DEFINITION).join(' ')} } ${Object.keys(omit(getFields(), ['recipient'])).join(' ')}`

const ajv = new Ajv()
const feeDistributionJsonSchema = {
    type: 'object',
    properties: {
        recipient: RecipientSchema,
        amount: { type: 'string' },
        order: { type: 'number' },
        vor: { type: 'boolean' },
        isFeePayer: { type: 'boolean' },
        overpaymentPart: { type: 'number' },
    },
    additionalProperties: false,
    required: ['recipient', 'amount'],
}

const feeDistributionsJsonSchema = {
    type: 'array',
    items: feeDistributionJsonSchema,
}

const jsonValidator = ajv.compile(feeDistributionsJsonSchema)
const gqlValidator = getGQLErrorValidator(jsonValidator, WRONG_AMOUNT_DISTRIBUTION_ERROR_TYPE)

const AMOUNT_DISTRIBUTION_FIELD = {
    schemaDoc: 'This optional field stores how to distribute amount between several receivers. Applicable to models with `toPay` field',
    type: 'Json',
    isRequired: false,
    extendGraphQLTypes: [AMOUNT_DISTRIBUTION_GRAPHQL_TYPES],
    graphQLInputType: AMOUNT_DISTRIBUTION_SCHEMA_INPUT,
    graphQLReturnType: AMOUNT_DISTRIBUTION_SCHEMA_FIELD,
    graphQLAdminFragment: `{ ${AMOUNT_DISTRIBUTION_QUERY_LIST} }`,
    hooks: {
        validateInput: async (attrs) => {
            gqlValidator(attrs)

            const { context, resolvedData, existingItem, fieldPath } = attrs
            /** @type {TDistribution[]} */
            const distribution = get(resolvedData, fieldPath)
            const nextToPay = get(resolvedData, DEFAULT_TO_PAY_FIELD_NAME, get(existingItem, DEFAULT_TO_PAY_FIELD_NAME))

            // Checking for every recipient has an approved mirrored BankAccount
            /** @type {BankAccount[]} */
            const bankAccounts = await find('BankAccount', {
                OR: distribution.reduce((res, { recipient }) => {
                    res.push({
                        AND: [
                            { tin: recipient.tin },
                            { routingNumber: recipient.bic },
                            { number: recipient.bankAccount },
                            { isApproved: true },
                            { deletedAt: null },
                        ],
                    })

                    return res
                }, []),
            })
            const distributionsWithNotApprovedRecipients = distribution.filter(({ recipient: r }) => {
                return bankAccounts.findIndex((b) => b.tin === r.tin && b.routingNumber === r.bic && b.number === r.bankAccount) < 0
            })
            if (distributionsWithNotApprovedRecipients.length > 0) {
                throw new GQLError(ERRORS.NO_APPROVED_BANK_ACCOUNT(distributionsWithNotApprovedRecipients.map(({ recipient: r }) => r)), context)
            }

            // Check that nextToPay === totalDistributionSum
            const distributionSum = distribution.reduce((sum, d) => sum.plus(d.amount), Big(0))
            if (!Big(nextToPay).eq(distributionSum)) {
                throw new GQLError(ERRORS.SUMS_NOT_MATCH(nextToPay, distributionSum.toString()), context)
            }

            // Each group must have a single vor-item
            const groupedDistributions = distribution.reduce((res, d) => {
                const order = get(d, 'order', 0)
                const orderGroup = get(res, order, [])
                orderGroup.push(d)
                set(res, order, orderGroup)

                return res
            }, {})

            for (const strIndex in Object.values(groupedDistributions)) {
                const order = Number(strIndex)
                if (!hasSingleVorItem(groupedDistributions[order])) {
                    throw new GQLError(ERRORS.NO_VOR_IN_GROUP(order), context)
                }
            }

            // For now, we can't get fee amount
            // We suppose that fee will be greater than nothing
            // So, the distribution must have feePayers
            if (!hasFeePayers(distribution)) {
                throw new GQLError(ERRORS.NO_FEE_PAYERS, context)
            }

            // Distribution must have someone who will receive overpayment
            if (!hasOverpaymentReceivers(distribution)) {
                throw new GQLError(ERRORS.NO_OVERPAYMENT_RECEIVER, context)
            }
        },
    },
}

module.exports = {
    AMOUNT_DISTRIBUTION_FIELD,
}
