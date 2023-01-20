const { Decimal } = require('@keystonejs/fields')

const { SignedDecimal } = require('./Implementation')

module.exports = {
    type: 'SignedDecimal',
    implementation: SignedDecimal,
    views: Decimal.views,
    adapters: Decimal.adapters,
}