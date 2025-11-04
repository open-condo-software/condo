import withLess from 'next-with-less'

import conf from '@open-condo/config'
import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import { antGlobalVariables } from '@condo/domains/common/constants/style'
import { getCurrentVersion } from '@condo/domains/common/utils/VersioningMiddleware'

import type { NextConfig } from 'next'

const serverUrl = conf['CONDO_DOMAIN']
const frontendUrl = conf['HELPDESK_WEB_DOMAIN']
const apolloGraphQLUrl = `${frontendUrl}/api/graphql`
const addressSuggestionsConfig = conf['ADDRESS_SUGGESTIONS_CONFIG'] && JSON.parse(conf['ADDRESS_SUGGESTIONS_CONFIG'])
const mapApiKey = conf['MAP_API_KEY']
const featureFlagsConfig = conf['FEATURE_FLAGS_CONFIG']
const docsConfig = { 'isGraphqlPlaygroundEnabled': conf['ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND'] === 'true' }
const googleCaptcha = conf['GOOGLE_RECAPTCHA_CONFIG'] && JSON.parse(conf['GOOGLE_RECAPTCHA_CONFIG'])
const TinyMceApiKey = conf['TINY_MCE_API_KEY']
const defaultLocale = conf.DEFAULT_LOCALE
const HelpRequisites = (conf['HELP_REQUISITES'] && JSON.parse(conf['HELP_REQUISITES'])) || {}
const yandexMetrikaID = conf['YANDEX_METRIKA_ID']
const audioConfig = JSON.parse(conf['AUDIO_CONFIG'] || '{}')
const isDisabledSsr = conf['DISABLE_SSR'] === 'true'
const isSnowfallDisabled = conf['IS_SNOWFALL_DISABLED'] === 'true'
const termsOfUseUrl = conf['LEGAL_TERMS_OF_USE_URL']
const privacyPolicyUrl = conf['LEGAL_PRIVACY_POLICY_URL']
const dataProcessingConsentUrl = conf['LEGAL_DATA_PROCESSING_CONSENT_URL']
const identificationUserRequiredFields = JSON.parse(conf['IDENTIFICATION_USER_REQUIRED_FIELDS'] || '{ "staff": ["phone"] }')
const identificationStaffUserRequiredFields = identificationUserRequiredFields?.staff || ['phone']
const inviteRequiredFields = conf['INVITE_REQUIRED_FIELDS'] ? JSON.parse(conf['INVITE_REQUIRED_FIELDS']) : identificationStaffUserRequiredFields
const footerConfig = JSON.parse(conf['FOOTER_CONFIG'] || '{}')
const sessionSecretKey = conf['SESSION_SECRET_KEY']
const aiEnabled = conf['AI_ENABLED']
const defaultStaffAuthMethods = conf['DEFAULT_STAFF_AUTH_METHODS'] ? JSON.parse(conf['DEFAULT_STAFF_AUTH_METHODS']) : []

const SSR_PROXY_CONFIG = JSON.parse(conf['SSR_PROXY_CONFIG'] || '{}')
const TRUSTED_PROXIES_CONFIG = JSON.parse(conf['TRUSTED_PROXIES_CONFIG'] || '{}')
const API_PROXY_CONFIG = JSON.parse(conf['API_PROXY_CONFIG'] || '{}')
const GRAPHQL_PROXY_NAME = conf['GRAPHQL_PROXY_NAME'] || 'Next'

const hCaptcha = conf['HCAPTCHA_CONFIG'] && JSON.parse(conf['HCAPTCHA_CONFIG'])
const hCaptchaSiteKey = conf['HCAPTCHA_CONFIG'] ? { SITE_KEY: hCaptcha['SITE_KEY'] } : {}

const nextConfig: NextConfig = {
    transpilePackages: [
        '@open-condo/codegen',
        '@open-condo/next',
        '@open-condo/featureflags',
        '@condo/domains',
        '@app/condo',
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
    publicRuntimeConfig: {
        // Will be available on both server and client
        frontendUrl,
        serverUrl,
        apolloGraphQLUrl,
        addressSuggestionsConfig,
        mapApiKey,
        googleCaptcha,
        docsConfig,
        defaultLocale,
        featureFlagsConfig,
        TinyMceApiKey,
        HelpRequisites,
        yandexMetrikaID,
        audioConfig,
        defaultStaffAuthMethods,
        isDisabledSsr,
        currentVersion: getCurrentVersion(),
        isSnowfallDisabled,
        termsOfUseUrl,
        privacyPolicyUrl,
        dataProcessingConsentUrl,
        inviteRequiredFields,
        footerConfig,
        aiEnabled,
        hCaptcha: hCaptchaSiteKey,
    },
    serverRuntimeConfig: {
        proxyName: GRAPHQL_PROXY_NAME,
        ssrProxyConfig: SSR_PROXY_CONFIG,
        apiProxyConfig: API_PROXY_CONFIG,
        trustedProxiesConfig: TRUSTED_PROXIES_CONFIG,
        sessionSecretKey,
    },
    async redirects () {
        return [
            {
                source: '/',
                destination: '/ticket',
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
