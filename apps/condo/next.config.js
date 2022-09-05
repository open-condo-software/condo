// @ts-check
const conf = require('@condo/config')
const withLess = require('@zeit/next-less')
const withCSS = require('@zeit/next-css')
const { antGlobalVariables } = require('@condo/domains/common/constants/style')
// Tell webpack to compile the "@condo/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module
const withTM = require('next-transpile-modules')([
    '@condo/next',
    '@condo/featureflags',
    '@condo/keystone',
    'rc-table',
    '@condo/domains',
    '@emotion/styled',
])
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const apolloGraphQLUrl = `${serverUrl}/admin/api`
const addressSuggestionsConfig = conf['ADDRESS_SUGGESTIONS_CONFIG'] && JSON.parse(conf['ADDRESS_SUGGESTIONS_CONFIG'])
const mapApiKey = conf['MAP_API_KEY']
const behaviorRecorder = { 'plerdy': conf['BEHAVIOR_RECORDER_PLERDY_CONFIG'] }
const featureFlagsConfig = conf['FEATURE_FLAGS_CONFIG']
const docsConfig = { 'isGraphqlPlaygroundEnabled': conf['ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND'] === 'true' }
const googleCaptcha = conf['GOOGLE_RECAPTCHA_CONFIG'] && JSON.parse(conf['GOOGLE_RECAPTCHA_CONFIG'])
const yandexMetrikaID = conf['YANDEX_METRIKA_ID']
const trackingConfig = conf['TRACKING_CONFIG'] && JSON.parse(conf['TRACKING_CONFIG'])
const defaultLocale = conf.DEFAULT_LOCALE
const insuranceAppUrl = conf['INSURANCE_APP_URL']
const JivoSiteWidgetId = conf['JIVO_SITE_WIDGET_ID']
const TinyMceApiKey = conf['TINY_MCE_API_KEY']

module.exports = withTM(withLess(withCSS({
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
        addressSuggestionsConfig,
        mapApiKey,
        googleCaptcha,
        behaviorRecorder,
        featureFlagsConfig,
        docsConfig,
        yandexMetrikaID,
        trackingConfig,
        defaultLocale,
        insuranceAppUrl,
        JivoSiteWidgetId,
        TinyMceApiKey,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
        modifyVars: antGlobalVariables,
    },
    async redirects () {
        return [
            {
                source: '/analytics/:path*',
                destination: '/reports/:path*',
                permanent: false,
            },
        ]
    },
    webpack: (config) => {
        const plugins = config.plugins

        // NOTE: Replace Moment.js with Day.js in antd project
        config.plugins = [...plugins, new AntdDayjsWebpackPlugin()]

        config.module.rules = [
            ...(config.module.rules || []),
            { test: /lang\/.*\.njk$/, use: 'raw-loader' },
        ]

        return config
    },
})))
