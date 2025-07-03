const conf = require('@open-condo/config')

const APP_TOKEN_KEY = conf.APP_TOKEN_KEY || 'appToken'
const CONDO_ACCESS_TOKEN_KEY = conf.CONDO_ACCESS_TOKEN_KEY || 'condoAccessToken'
const CONDO_REFRESH_TOKEN_KEY = conf.CONDO_REFRESH_TOKEN_KEY || 'condoRefreshToken'
const CONDO_ORGANIZATION_ID_KEY = conf.CONDO_ORGANIZATION_ID_KEY || 'condoOrganizationId'
const ACCEPT_LANGUAGE = conf.ACCEPT_LANGUAGE || 'accept-language'

module.exports = {
    ACCEPT_LANGUAGE,
    APP_TOKEN_KEY,
    CONDO_ACCESS_TOKEN_KEY,
    CONDO_REFRESH_TOKEN_KEY,
    CONDO_ORGANIZATION_ID_KEY,
}
