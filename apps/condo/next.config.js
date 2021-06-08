const conf = require('@core/config')
const withLess = require('@zeit/next-less')
const withCSS = require('@zeit/next-css')
const { antGlobalVariables } = require('@condo/domains/common/constants/style')
// Tell webpack to compile the "@core/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module
const withTM = require('next-transpile-modules')(['@core/next', '@core/keystone', 'rc-table', '@condo/domains'])

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const apolloGraphQLUrl = `${serverUrl}/admin/api`
const firebaseConfig = conf['FIREBASE_CONFIG'] && JSON.parse(conf['FIREBASE_CONFIG'])
const addressSuggestionsConfig = conf['ADDRESS_SUGGESTIONS_CONFIG'] && JSON.parse(conf['ADDRESS_SUGGESTIONS_CONFIG'])
const mapApiKey = conf['MAP_API_KEY']
const behaviorRecorder = { 'plerdy': conf['BEHAVIOR_RECORDER_PLERDY_CONFIG'] }
const docsConfig = { 'isGraphqlPlaygroundEnabled': conf['ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND'] === 'true' }

module.exports = withTM(withLess(withCSS({
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
        firebaseConfig,
        addressSuggestionsConfig,
        mapApiKey,
        behaviorRecorder,
        docsConfig,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
        modifyVars: antGlobalVariables,
    },
})))
