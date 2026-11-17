const { resolveAccounts } = require('@condo/domains/billing/schema/resolvers/accountResolver')
const { resolveCategories } = require('@condo/domains/billing/schema/resolvers/categoryResolver')
const { resolvePeriods } = require('@condo/domains/billing/schema/resolvers/periodResolver')
const { resolveProperties } = require('@condo/domains/billing/schema/resolvers/propertyResolver')
const { resolveReceipts } = require('@condo/domains/billing/schema/resolvers/receiptResolver')
const { resolveRecipients } = require('@condo/domains/billing/schema/resolvers/recipientResolver')
const { resolveValidation } = require('@condo/domains/billing/schema/resolvers/validatorResolver')


module.exports = {
    resolveAccounts,
    resolveCategories,
    resolvePeriods,
    resolveProperties,
    resolveRecipients,
    resolveReceipts,
    resolveValidation,
}
