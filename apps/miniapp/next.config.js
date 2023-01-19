const withCSS = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
const withTMModule = require('next-transpile-modules')

const conf = require('@open-condo/config')

const { antGlobalVariables } = require('@condo/domains/common/constants/style')

// Tell webpack to compile the "@open-condo/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module
const withTM = withTMModule([
    '@open-condo/codegen',
    '@open-condo/next',
    '@open-condo/keystone',
    'rc-table',
    '@condo/domains',
    '@app/condo',
    '@miniapp/domains',
    '@app/miniapp',
])

const serverUrl = conf['SERVER_URL']
const apolloGraphQLUrl = `${serverUrl}/admin/api`
const addressSuggestionsConfig = conf['ADDRESS_SUGGESTIONS_CONFIG'] && JSON.parse(conf['ADDRESS_SUGGESTIONS_CONFIG'])
const mapApiKey = conf['MAP_API_KEY']
const behaviorRecorder = { 'plerdy': conf['BEHAVIOR_RECORDER_PLERDY_CONFIG'] }
const docsConfig = { 'isGraphqlPlaygroundEnabled': conf['ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND'] === 'true' }
const googleCaptcha = conf['GOOGLE_RECAPTCHA_CONFIG'] && JSON.parse(conf['GOOGLE_RECAPTCHA_CONFIG'])

const condoUrl = process.env.CONDO_URL

module.exports = withTM(withLess(withCSS({
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
        addressSuggestionsConfig,
        mapApiKey,
        googleCaptcha,
        behaviorRecorder,
        docsConfig,
        condoUrl,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
        modifyVars: antGlobalVariables,
    },
    webpack: (config) => {
        const plugins = config.plugins

        // NOTE: Replace Moment.js with Day.js in antd project
        config.plugins = [ ...plugins, new AntdDayjsWebpackPlugin() ]
        config.module.rules = [
            ...(config.module.rules || []),
            { test: /lang\/.*\.njk$/, use: 'raw-loader' },
        ]

        return config
    },
})))
