import conf from '@open-condo/config'
import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import { LOCALES, DEFAULT_LOCALE } from '@/domains/common/constants/locales'

import type { NextConfig } from 'next'

const DOCS_ENTRY_ENDPOINT = conf['DOCS_ENTRY_ENDPOINT'] || '/docs/index'
// NOTE: Url of API server
const SERVER_URL = conf['DEV_PORTAL_API_DOMAIN'] || 'http://localhost:4006'
// NOTE: Url of current service
const SERVICE_URL = conf['DEV_PORTAL_WEB_DOMAIN'] || 'http://localhost:3000'
const ADDRESS_SERVICE_URL = conf['ADDRESS_SERVICE_DOMAIN'] || 'http://localhost:4001'
// NOTE: Value to override via headers
const GRAPHQL_PROXY_NAME = conf['GRAPHQL_PROXY_NAME'] || 'Next'

const termsOfUseUrl = conf['LEGAL_TERMS_OF_USE_URL']
const privacyPolicyUrl = conf['LEGAL_PRIVACY_POLICY_URL']
const dataProcessingConsentUrl = conf['LEGAL_DATA_PROCESSING_CONSENT_URL']

const nextConfig: NextConfig = {
    reactStrictMode: true,
    i18n: {
        locales: LOCALES,
        defaultLocale: DEFAULT_LOCALE,
    },
    publicRuntimeConfig: {
        serverUrl: SERVER_URL,
        serviceUrl: SERVICE_URL,
        addressServiceUrl: ADDRESS_SERVICE_URL,
        termsOfUseUrl,
        privacyPolicyUrl,
        dataProcessingConsentUrl,
    },
    serverRuntimeConfig: {
        proxyName: GRAPHQL_PROXY_NAME,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '**',
            },
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    async redirects () {
        return [
            {
                source: '/',
                destination: DOCS_ENTRY_ENDPOINT,
                permanent: false,
            },
            {
                source: '/docs',
                destination: DOCS_ENTRY_ENDPOINT,
                permanent: false,
            },
        ]
    },
    webpack: (config) => {
        return nextCamelCaseCSSModulesTransform(config)
    },
}

module.exports = nextConfig