const withCSS = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
const withTMModule = require('next-transpile-modules')

const conf = require('@open-condo/config')

const { antGlobalVariables } = require('@app/condo/domains/common/constants/style')
const { DEFAULT_LOCALE } = require('@miniapp/domains/common/constants')

// Tell webpack to compile the "@open-condo/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module

const withTM = withTMModule([
    '@open-condo/codegen',
    '@open-condo/next',
    '@app/condo',
    '@miniapp/domains',
])

const serverUrl = conf['SERVER_URL']
const apolloGraphQLUrl = `${serverUrl}/graphql`
const condoUrl = conf['CONDO_DOMAIN']
const b2bAppId = conf['CONDO_B2B_APP_ID'] || null
const defaultLocale = DEFAULT_LOCALE

module.exports = withTM(withLess(withCSS({
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