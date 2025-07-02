const { SearchByAddressKey } = require('./SearchByAddressKey')
const { SearchByFiasId } = require('./SearchByFiasId')
const { SearchByGooglePlaceId } = require('./SearchByGooglePlaceId')
const { SearchByInjectionId } = require('./SearchByInjectionId')
const { SearchByProvider } = require('./SearchByProvider')
const { SearchBySource } = require('./SearchBySource')

module.exports = {
    SearchBySource,
    SearchByProvider,
    SearchByAddressKey,
    SearchByInjectionId,
    SearchByGooglePlaceId,
    SearchByFiasId,
}
