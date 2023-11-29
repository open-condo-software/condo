const { AccountResolver } = require('@condo/domains/billing/schema/resolvers/accountResolver')
const { CategoryResolver } = require('@condo/domains/billing/schema/resolvers/categoryResolver')
const { PeriodResolver } = require('@condo/domains/billing/schema/resolvers/periodResolver')
const { PropertyResolver } = require('@condo/domains/billing/schema/resolvers/propertyResolver')
const { ReceiptResolver } = require('@condo/domains/billing/schema/resolvers/receiptResolver')
const { RecipientResolver } = require('@condo/domains/billing/schema/resolvers/recipientResolver')


module.exports = {
    AccountResolver,
    CategoryResolver,
    PeriodResolver,
    PropertyResolver,
    RecipientResolver,
    ReceiptResolver,
}