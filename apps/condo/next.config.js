// @ts-check
const { withSentryConfig } = require('@sentry/nextjs')
const withCSS = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
const withTMModule = require('next-transpile-modules')

const conf = require('@open-condo/config')

const { antGlobalVariables } = require('@condo/domains/common/constants/style')
const { getCurrentVersion } = require('@condo/domains/common/utils/VersioningMiddleware')

const { name } = require('./package.json')

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

const appName = name
const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const apolloGraphQLUrl = `${serverUrl}/admin/api`
const addressServiceUrl = conf['ADDRESS_SERVICE_URL']
const mapApiKey = conf['MAP_API_KEY']
const behaviorRecorder = { 'plerdy': conf['BEHAVIOR_RECORDER_PLERDY_CONFIG'] }
const canEnableSubscriptions = conf['CAN_ENABLE_SUBSCRIPTIONS'] === 'true'
const docsConfig = { 'isGraphqlPlaygroundEnabled': conf['ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND'] === 'true' }
// TODO(DOMA-8696): Update next.config in cc, eps, miniapp
const hCaptcha = conf['HCAPTCHA_CONFIG'] && JSON.parse(conf['HCAPTCHA_CONFIG'])
const disableCaptcha = conf.DISABLE_CAPTCHA === 'true'
const yandexMetrikaID = conf['YANDEX_METRIKA_ID']
const googleTagManagerId  = conf['GOOGLE_TAG_MANAGER_ID']
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
const condoRBDomain = conf['RB_DOMAIN']
const sentryConfig = conf['SENTRY_CONFIG'] ? JSON.parse(conf['SENTRY_CONFIG']) : {}
const apolloBatchingEnabled = conf['APOLLO_BATCHING_ENABLED'] === 'true'
const tourVideoUrl = JSON.parse(conf['TOUR_VIDEO_URL'] || '{}')
const residentAppLandingUrl = JSON.parse(conf['RESIDENT_APP_LANDING_URL'] || '{}')
const createMapVideoUrl = JSON.parse(conf['CREATE_MAP_VIDEO_URL'] || '{}')
const guideAboutAppBlock = JSON.parse(conf['GUIDE_ABOUT_APP_BLOCK'] || '{}')
const guideIntroduceAppBlock = JSON.parse(conf['GUIDE_INTRODUCE_APP_BLOCK'] || '{}')
const guideModalCardReviews = JSON.parse(conf['GUIDE_MODAL_CARD_REVIEWS'] || '{}')
const importInstructionUrl = JSON.parse(conf['IMPORT_INSTRUCTION_URL'] || '{}')
const telegramEmployeeBotName = conf['TELEGRAM_EMPLOYEE_BOT_NAME']
const isDisabledSsr = conf['DISABLE_SSR'] === 'true'
const termsOfUseUrl = conf['LEGAL_TERMS_OF_USE_URL']
const privacyPolicyUrl = conf['LEGAL_PRIVACY_POLICY_URL']
const dataProcessingConsentUrl = conf['LEGAL_DATA_PROCESSING_CONSENT_URL']
const isSnowfallDisabled = conf['IS_SNOWFALL_DISABLED'] === 'true'
const proxyName = conf['API_PROXY_NAME'] || 'Next'
const posthogApiHost = conf['POSTHOG_API_HOST']
const posthogApiKey = conf['POSTHOG_API_KEY']
const residentAppInfo = conf['RESIDENT_APP_INFO'] ? JSON.parse(conf['RESIDENT_APP_INFO']) : {}
const aiEnabled = conf['AI_ENABLED']

let nextConfig = withTM(withLess(withCSS({
    skipTrailingSlashRedirect: true,
    publicRuntimeConfig: {
        // Will be available on both server and client
        appName,
        currentVersion: getCurrentVersion(),
        serverUrl,
        apolloGraphQLUrl,
        addressServiceUrl,
        mapApiKey,
        canEnableSubscriptions,
        hCaptcha,
        disableCaptcha,
        behaviorRecorder,
        docsConfig,
        yandexMetrikaID,
        googleTagManagerId,
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
        tourVideoUrl,
        residentAppLandingUrl,
        createMapVideoUrl,
        guideAboutAppBlock,
        guideIntroduceAppBlock,
        guideModalCardReviews,
        importInstructionUrl,
        telegramEmployeeBotName,
        isDisabledSsr,
        termsOfUseUrl,
        privacyPolicyUrl,
        dataProcessingConsentUrl,
        isSnowfallDisabled,
        posthogApiHost,
        posthogApiKey,
        residentAppInfo,
        aiEnabled,
    },
    serverRuntimeConfig: {
        proxyName,
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
            silent: true,
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
