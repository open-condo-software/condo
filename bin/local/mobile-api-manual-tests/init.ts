const nodeFetch = require('cross-fetch/polyfill').fetch

const { AddressApi, AddressSuggestionConfig } = require('@condo/domains/common/utils/AddressApi')

const { CondoApi } = require('../lib/condo-api')
const { parseEnv } = require('./utils')
const { PROJECT_ENV_PATH, ENV_PATH, PROJECT_ENV_REQUIRED_FIELDS, ENV_REQUIRED_FIELDS } = require('./constants')

const ENV = parseEnv(ENV_PATH, ENV_REQUIRED_FIELDS)
const PROJECT_ENV = parseEnv(PROJECT_ENV_PATH, PROJECT_ENV_REQUIRED_FIELDS)

const USER_AUTH_INFO = {
    endpoint: ENV.SERVER_URL,
    name: ENV.USER_NAME,
    city: ENV.USER_CITY,
    country: ENV.USER_COUNTRY,
    phone: ENV.USER_PHONE,
    email: ENV.USER_EMAIL,
    password: ENV.USER_PASSWORD,
    address: ENV.USER_ADDRESS,
}

const ADMIN_AUTH_INFO = {
    endpoint: ENV.SERVER_URL,
    phone: ENV.ADMIN_PHONE,
    email: ENV.ADMIN_EMAIL,
    password: ENV.ADMIN_PASSWORD,
}

const addressSuggestionsConfig = JSON.parse(PROJECT_ENV.ADDRESS_SUGGESTIONS_CONFIG) as typeof AddressSuggestionConfig
const CondoUser = new CondoApi(USER_AUTH_INFO)
const CondoAdmin = new CondoApi(ADMIN_AUTH_INFO)
const AddressAPI = new AddressApi({ publicRuntimeConfig: { addressSuggestionsConfig } }, nodeFetch)

module.exports = {
    CondoUser,
    CondoAdmin,
    AddressAPI,
}