const withTMModule = require('next-transpile-modules')

const conf = require('@open-condo/config')

const { antGlobalVariables } = require('@condo/domains/common/constants/style')

const { DEFAULT_LOCALE } = require('@{{name}}/domains/common/constants')

// Tell webpack to compile the "@open-condo/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module

const withTM = withTMModule([
    '@open-condo/codegen',
    '@open-condo/next',
    '@open-condo/bridge',
    '@open-condo/featureflags',
    '@open-condo/keystone',
    '@emotion/styled',
    '@app/condo',
    '@app/{{name}}',
    '@condo/domains',
    '@{{name}}/domains',
    'rc-table',
])

const serverUrl = conf['SERVER_URL']
const apolloGraphQLUrl = `${serverUrl}/graphql`
const condoUrl = conf['CONDO_DOMAIN']
const b2bAppId = conf['CONDO_B2B_APP_ID'] || null
const defaultLocale = DEFAULT_LOCALE

module.exports = withTM({
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
        condoUrl,
        b2bAppId,
        defaultLocale,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
        modifyVars: antGlobalVariables,
    },
    webpack: (config) => {

        return config
    },
})