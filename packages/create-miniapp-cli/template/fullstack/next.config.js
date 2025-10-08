const withCSS = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
const withTMModule = require('next-transpile-modules')

const conf = require('@open-condo/config')


// Tell webpack to compile the "@open-condo/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module
const withTM = withTMModule([
    '@open-condo/codegen',
    '@open-condo/next',
    '@open-condo/keystone',
    'rc-table',
    '@billing-connector/domains',
    '@app/condo',
    '@app/billing-connector',
])

const serverUrl = conf['SERVER_URL']
const apolloGraphQLUrl = `${serverUrl}/graphql`
const condoUrl = process.env.CONDO_DOMAIN || serverUrl
const oneSb2bAppId = process.env.ONE_S_B2B_APP_ID
const integrationConfig = process.env.INTEGRATION_CONFIG ? JSON.parse(process.env.INTEGRATION_CONFIG) : {}
const helpRequisites = (conf['HELP_REQUISITES'] && JSON.parse(conf['HELP_REQUISITES'])) || {}


module.exports = withTM(withLess(withCSS({
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
        condoUrl,
        integrationConfig,
        helpRequisites,
        oneSb2bAppId,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
    },
    transpileModules: ['symlinks'],
    webpack: (config) => {
        const plugins = config.plugins

        // NOTE: Replace Moment.js with Day.js in antd project
        config.plugins = [...plugins, new AntdDayjsWebpackPlugin()]

        config.module.rules = [
            ...(config.module.rules || []),
            { test: /lang\/.*\.njk$/, use: 'raw-loader' },
            { test: /\.xlsx|\.png|\.pdf$/, use: 'ignore-loader' },
        ]
        return config
    },
})))
