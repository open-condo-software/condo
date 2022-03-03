const { buildBicryptId } = require('./buildBicryptId')
const { changeClientSecret } = require('./changeClientSecret')
const { getOrganizationAccessToken } = require('./getOrganizationAccessToken')
const { refreshAllTokens } = require('./refreshAllTokens')

module.exports = {
    buildBicryptId,
    changeClientSecret,
    getOrganizationAccessToken,
    refreshAllTokens,
}