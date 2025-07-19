const identity = require('lodash/identity')

const conf = require('@open-condo/config')
const { HealthCheck, getRedisHealthCheck, getPostgresHealthCheck } = require('@open-condo/keystone/healthCheck')
const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')

const { OIDCKeystoneApp } = require('@address-service/domains/common/oidc')
const {
    getAddressProviderBalanceHealthCheck,
    getAddressProviderLimitHealthCheck,
} = require('@address-service/domains/common/utils/healthchecks')
const {
    SearchBySource,
    SearchByProvider,
    SearchByAddressKey,
    SearchByInjectionId,
    SearchByGooglePlaceId,
    SearchByFiasId,
} = require('@address-service/domains/common/utils/services/search/plugins')
const { SearchKeystoneApp } = require('@address-service/domains/common/utils/services/search/SearchKeystoneApp')
const { SuggestionKeystoneApp } = require('@address-service/domains/common/utils/services/suggest/SuggestionKeystoneApp')

const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'

if (conf.NODE_ENV === 'production' && IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND) {
    console.log('☢️ Please disable or remove the ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND env variable')
}

const schemas = () => [
    require('@address-service/domains/user/schema'),
    require('@address-service/domains/address/schema'),
]

const checks = [
    getPostgresHealthCheck(),
    getRedisHealthCheck(),
    getAddressProviderBalanceHealthCheck(),
    getAddressProviderLimitHealthCheck(),
]

const apps = () => [
    new HealthCheck({
        checks,
    }),
    conf.DISABLE_OIDC_AUTH ? undefined : new OIDCKeystoneApp(),
    new SuggestionKeystoneApp(),
    new SearchKeystoneApp([
        new SearchByAddressKey(),
        new SearchBySource(),
        new SearchByInjectionId(),
        new SearchByFiasId(),
        new SearchByGooglePlaceId(),
        new SearchByProvider(),
    ]),
].filter(identity)

module.exports = prepareKeystone({
    schemas, apps,
})
