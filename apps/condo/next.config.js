// @ts-check
const { withSentryConfig } = require('@sentry/nextjs')
const withCSS = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
const falsey = require('falsey')
const withTMModule = require('next-transpile-modules')

const conf = require('@open-condo/config')

const { antGlobalVariables } = require('@condo/domains/common/constants/style')
const { getCurrentVersion } = require('@condo/domains/common/utils/VersioningMiddleware')

// Tell webpack to compile the "@open-condo/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module
const withTM = withTMModule([
    '@open-condo/codegen',
    '@open-condo/next',
    '@open-condo/featureflags',
    '@open-condo/keystone',
    'rc-table',
    '@condo/domains',
    '@emotion/styled',
])

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const apolloGraphQLUrl = `${serverUrl}/admin/api`
const addressServiceUrl = conf['ADDRESS_SERVICE_URL']
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
const UseDeskWidgetId = conf['USE_DESK_WIDGET_ID']
const HelpRequisites = (conf['HELP_REQUISITES'] && JSON.parse(conf['HELP_REQUISITES'])) || {}
const popupSmartConfig = JSON.parse(conf['POPUP_SMART_CONFIG'] || '{}')
const hasSbbolAuth = Boolean((conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}).client_id)
const sppConfig = JSON.parse(conf['SPP_CONFIG'] || '{}')
const globalHints = JSON.parse(conf['GLOBAL_HINTS'] || '{}')
const newsItemsSendingDelay = Number(conf['NEWS_ITEMS_SENDING_DELAY_SEC']) || 15
const audioConfig = JSON.parse(conf['AUDIO_CONFIG'] || '{}')
const checkTLSClientCertConfig = JSON.parse(conf['CHECK_TLS_CLIENT_CERT_CONFIG'] || '{}')
const condoRBDomain = conf['CONDORB_DOMAIN']
const sentryConfig = conf['SENTRY_CONFIG'] ? JSON.parse(conf['SENTRY_CONFIG']) : {}
const apolloBatchingEnabled = !falsey(conf['APOLLO_BATCHING_ENABLED'])
const tourVideoUrl = JSON.parse(conf['TOUR_VIDEO_URL'] || '{}')
const externalGuideUrl = conf['EXTERNAL_GUIDE_URL'] || ''
const residentAppLandingUrl = conf['RESIDENT_APP_LANDING_URL'] || ''
const createMapVideoUrl = conf['CREATE_MAP_VIDEO_URL'] || ''

let nextConfig = withTM(withLess(withCSS({
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
        addressServiceUrl,
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
        UseDeskWidgetId,
        HelpRequisites,
        popupSmartConfig,
        hasSbbolAuth,
        sppConfig,
        globalHints,
        newsItemsSendingDelay,
        audioConfig,
        checkTLSClientCertConfig,
        condoRBDomain,
        sentryConfig,
        apolloBatchingEnabled,
        currentVersion: getCurrentVersion(),
        tourVideoUrl,
        externalGuideUrl,
        residentAppLandingUrl,
        createMapVideoUrl,
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
            { test: /lang\/.*\.md$/, use: 'raw-loader' },
        ]

        return config
    },

})))

if (sentryConfig['client']) {
    nextConfig = withSentryConfig(
        nextConfig,
        {
            dryRun: true,
            silent: false,
            org: sentryConfig['client']['organization'],
            project: sentryConfig['client']['project'],
            validate: true,
            widenClientFileUpload: true,
            transpileClientSDK: false,
            hideSourceMaps: true,
            disableLogger: true,
            automaticVercelMonitors: false,
            autoInstrumentServerFunctions: false,
            autoInstrumentMiddleware: false,
        },
    )
}

module.exports = nextConfig
