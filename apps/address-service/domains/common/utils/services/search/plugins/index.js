const { SearchBySource } = require('./SearchBySource')
const { SearchByProvider } = require('./SearchByProvider')
const { SearchByAddressKey } = require('./SearchByAddressKey')
const { SearchByInjectionId } = require('./SearchByInjectionId')
const { SearchByGooglePlaceId } = require('./SearchByGooglePlaceId')
const { SearchByFiasId } = require('./SearchByFiasId')

module.exports = {
    SearchBySource,
    SearchByProvider,
    SearchByAddressKey,
    SearchByInjectionId,
    SearchByGooglePlaceId,
    SearchByFiasId,
}
