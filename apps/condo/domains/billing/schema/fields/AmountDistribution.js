const Ajv = require('ajv')
const Big = require('big.js')
const { omit, get, set } = require('lodash')

const {
    hasOverpaymentReceivers,
    hasSingleVorItem,
    getVorItems,
    hasFeePayers,
    areAllRecipientsUnique,
} = require('@open-condo/billing/utils/paymentSplitter')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')

const {
    RECIPIENT_FIELD_NAME,
    RECIPIENT_INPUT_NAME,
    RECIPIENT_FIELDS_DEFINITION,
    RecipientSchema,
} = require('@condo/domains/acquiring/schema/fields/Recipient')
const {
    WRONG_AMOUNT_DISTRIBUTION_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NO_APPROVED_BANK_ACCOUNT_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_SUMS_NOT_MATCH_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NO_VOR_IN_GROUP_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NO_FEE_PAYER_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NO_OVERPAYMENT_RECEIVER_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_NOT_UNIQUE_RECIPIENTS_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_VOR_MUST_BE_FEE_PAYER_ERROR_TYPE,
    AMOUNT_DISTRIBUTION_FIELD_VOR_MUST_BE_OVERPAYMENT_RECEIVER_ERROR_TYPE,
} = require('@condo/domains/billing/constants/errors')
const { render, getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')
const { SERVICE } = require('@condo/domains/user/constants/common')

const AMOUNT_DISTRIBUTION_FIELD_NAME = 'AmountDistributionField'
const AMOUNT_DISTRIBUTION_INPUT_NAME = 'AmountDistributionFieldInput'
const AMOUNT_DISTRIBUTION_SCHEMA_FIELD = `[${AMOUNT_DISTRIBUTION_FIELD_NAME}!]`
const AMOUNT_DISTRIBUTION_SCHEMA_INPUT = `[${AMOUNT_DISTRIBUTION_INPUT_NAME}!]`

const ERRORS = {
    NO_APPROVED_BANK_ACCOUNT: {
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_NO_APPROVED_BANK_ACCOUNT_ERROR_TYPE,
        message: 'Some recipients not approved. Please connect to support.',
    },
    SUMS_NOT_MATCH: {
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_SUMS_NOT_MATCH_ERROR_TYPE,
        message: 'Total sum (toPay={toPay}) is not match to sum of distributions ({distributionsSum})',
    },
    NO_VOR_IN_GROUP: {
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_NO_VOR_IN_GROUP_ERROR_TYPE,
        message: 'Group {order} does not contains a SINGLE element with vor=true',
    },
    VOR_MUST_BE_FEE_PAYER: {
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_VOR_MUST_BE_FEE_PAYER_ERROR_TYPE,
        message: 'The victim of rounding (vor) must have isFeePayer=true',
    },
    VOR_MUST_BE_OVERPAYMENT_RECEIVER: {
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_VOR_MUST_BE_OVERPAYMENT_RECEIVER_ERROR_TYPE,
        message: 'The victim of rounding (vor) must have overpaymentPart value',
    },
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
    NOT_UNIQUE_RECIPIENTS: {
        code: BAD_USER_INPUT,
        type: AMOUNT_DISTRIBUTION_FIELD_NOT_UNIQUE_RECIPIENTS_ERROR_TYPE,
        message: 'Distribution contains not unique recipients',
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
    /**
     * @see {import('@open-condo/billing/utils/paymentSplitter').TDistribution}
     */
    properties: {
        /**
         * @see {import('@open-condo/billing/utils/paymentSplitter').TRecipient}
         */
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
    minItems: 1,
    maxItems: 5,
}

const jsonValidator = ajv.compile(feeDistributionsJsonSchema)
const gqlValidator = getGQLErrorValidator(jsonValidator, WRONG_AMOUNT_DISTRIBUTION_ERROR_TYPE)

const canReadOrManageField = async (args) => {
    const { authentication: { item: user } } = args

    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    // We allow read field for service user
    // Because this user already checked for access
    return user.type === SERVICE
}
/**
 * @typedef {Object} TValidateInputAttrs
 * @property {Object} existingItem
 * @property {Object} resolvedData
 */

/**
 * @param {string} toPayFieldName The name of field with total amount
 * @param {function(context: *, validateInputAttrs: TValidateInputAttrs): Promise<string>} organizationIdResolver The function which must return an organization id. Implementation depends on the item type.
 * @returns {*} The organization's id
 */
const AMOUNT_DISTRIBUTION_FIELD = ({ toPayFieldName = 'toPay',
    organizationIdResolver = async (_, {
        existingItem,
        resolvedData,
    }) => get({ ...existingItem, ...resolvedData }, 'organization'),
} = {}) => ({
    schemaDoc: 'This optional field stores how to distribute amount between several receivers.',
    type: 'Json',
    sensitive: true,
    isRequired: false,
    extendGraphQLTypes: [AMOUNT_DISTRIBUTION_GRAPHQL_TYPES],
    graphQLInputType: AMOUNT_DISTRIBUTION_SCHEMA_INPUT,
    graphQLReturnType: AMOUNT_DISTRIBUTION_SCHEMA_FIELD,
    graphQLAdminFragment: `{ ${AMOUNT_DISTRIBUTION_QUERY_LIST} }`,
    access: {
        create: canReadOrManageField,
        read: canReadOrManageField,
        update: canReadOrManageField,
    },
    hooks: {
        validateInput: async (attrs) => {
            gqlValidator(attrs)

            const { context, resolvedData, existingItem, fieldPath } = attrs
            /** @type {TDistribution[]} */
            const distribution = get(resolvedData, fieldPath)
            const nextToPay = get(resolvedData, toPayFieldName, get(existingItem, toPayFieldName))
            const nextOrganizationId = await organizationIdResolver(context, attrs)

            // Checking if recipients are uniq
            if (!areAllRecipientsUnique(distribution)) {
                throw new GQLError(ERRORS.NOT_UNIQUE_RECIPIENTS, context)
            }

            // Checking for every recipient has an approved mirrored BankAccount
            /** @type {BankAccount[]} */
            const bankAccounts = await find('BankAccount', {
                OR: distribution.map(({ recipient }) => ({
                    AND: [
                        { organization: { id: nextOrganizationId } },
                        { tin: recipient.tin },
                        { routingNumber: recipient.bic },
                        { number: recipient.bankAccount },
                        { isApproved: true },
                        { deletedAt: null },
                    ],
                })),
            })
            const distributionsWithNotApprovedRecipients = distribution.filter(({ recipient: r }) => {
                return bankAccounts.findIndex((b) => b.tin === r.tin && b.routingNumber === r.bic && b.number === r.bankAccount) < 0
            })
            if (distributionsWithNotApprovedRecipients.length > 0) {
                throw new GQLError({
                    ...ERRORS.NO_APPROVED_BANK_ACCOUNT,
                    notApprovedRecipients: distributionsWithNotApprovedRecipients.map(({ recipient: r }) => r),
                }, context)
            }

            // Check that nextToPay === totalDistributionSum
            const distributionSum = distribution.reduce((sum, d) => sum.plus(d.amount), Big(0))
            if (!Big(nextToPay).eq(distributionSum)) {
                throw new GQLError({
                    ...ERRORS.SUMS_NOT_MATCH,
                    messageInterpolation: { toPay: nextToPay, distributionsSum: distributionSum.toString() },
                }, context)
            }

            // Each group must have a single vor-item
            const groupedDistributions = distribution.reduce((res, d) => {
                const order = get(d, 'order', 0)
                const orderGroup = get(res, order, [])
                orderGroup.push(d)
                set(res, order, orderGroup)

                return res
            }, {})

            for (const [order, group] of Object.entries(groupedDistributions)) {
                if (!hasSingleVorItem(group)) {
                    throw new GQLError({
                        ...ERRORS.NO_VOR_IN_GROUP,
                        messageInterpolation: { order: Number(order) },
                    }, context)
                }

                // vor-item must pay fee and receive overpayments
                const [vorItem] = getVorItems(group)
                if (!vorItem.isFeePayer) {
                    throw new GQLError(ERRORS.VOR_MUST_BE_FEE_PAYER, context)
                }
                if (!vorItem.overpaymentPart) {
                    throw new GQLError(ERRORS.VOR_MUST_BE_OVERPAYMENT_RECEIVER, context)
                }
            }

            // For now, we can't get fee amount here
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
})

module.exports = {
    AMOUNT_DISTRIBUTION_FIELD,
}
