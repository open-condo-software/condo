import withLess from 'next-with-less'

import conf from '@open-condo/config'
import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import { antGlobalVariables } from '@condo/domains/common/constants/style'
import { getCurrentVersion } from '@condo/domains/common/utils/VersioningMiddleware'

import { name } from './package.json'

import type { NextConfig } from 'next'

const appName = name
const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const apolloGraphQLUrl = `${serverUrl}/admin/api`
const addressServiceUrl = conf['ADDRESS_SERVICE_URL']
const mapApiKey = conf['MAP_API_KEY']
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
const defaultCurrencyCode = conf['DEFAULT_CURRENCY_CODE'] || 'RUB'
const aiEnabled = conf['AI_ENABLED']
const contactPageResidentAnalytics = JSON.parse(conf['CONTACT_PAGE_RESIDENT_ANALYTICS'] || '{}')
const displayTicketInfoOnShare = conf['SHOW_TICKET_INFO_ON_SHARE'] === 'true'
const identificationUserRequiredFields = JSON.parse(conf['IDENTIFICATION_USER_REQUIRED_FIELDS'] || '{ "staff": ["phone"] }')
const identificationStaffUserRequiredFields = identificationUserRequiredFields?.staff || ['phone']
const inviteRequiredFields = conf['INVITE_REQUIRED_FIELDS'] ? JSON.parse(conf['INVITE_REQUIRED_FIELDS']) : identificationStaffUserRequiredFields
const footerConfig = JSON.parse(conf['FOOTER_CONFIG'] || '{}')
const defaultStaffAuthMethods = conf['DEFAULT_STAFF_AUTH_METHODS'] ? JSON.parse(conf['DEFAULT_STAFF_AUTH_METHODS']) : []
const verifyUserEmailWithMarketingConsentEnabled = conf['VERIFY_USER_EMAIL_WITH_MARKETING_CONSENT_ENABLED'] === 'true'

const hCaptchaSiteKey = conf['HCAPTCHA_CONFIG'] ? { SITE_KEY: hCaptcha['SITE_KEY'] } : {}

const nextConfig: NextConfig = {
    transpilePackages: [
        '@open-condo/codegen',
        '@open-condo/next',
        '@open-condo/featureflags',
        '@condo/domains',
    ],
    compiler: {
        emotion: true,
    },
    lessLoaderOptions: {
        lessOptions: {
            javascriptEnabled: true,
            modifyVars: antGlobalVariables,
        },
    },
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
        hCaptcha: hCaptchaSiteKey,
        disableCaptcha,
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
        defaultCurrencyCode,
        aiEnabled,
        contactPageResidentAnalytics,
        displayTicketInfoOnShare,
        inviteRequiredFields,
        footerConfig,
        defaultStaffAuthMethods,
        verifyUserEmailWithMarketingConsentEnabled,
    },
    serverRuntimeConfig: {
        proxyName,
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
        config.module.rules = [
            ...(config.module.rules || []),
            {
                test: /[\\/]lang[\\/].*\.njk$/,
                type: 'asset/source',
            },
            {
                test: /[\\/]lang[\\/].*\.md$/,
                type: 'asset/source',
            },
        ]
        return nextCamelCaseCSSModulesTransform(config)
    },
}

export default withLess(nextConfig)
