// NOTE: Used to load TS files (locales) into CJS
// TODO: Node@24 supports importing ts-modules and omitting types, Next@15.1 support next.config.ts, so choose 1 option and migrate safely
const tsNode = require('ts-node')
const service = tsNode.register({
    transpileOnly: true,
    compilerOptions: { module: 'CommonJS' },
})

// eslint-disable-next-line import/order
const { LOCALES, DEFAULT_LOCALE } = require('./domains/common/constants/locales.ts')
// NOTE: Don't move this line of code, disable ts-node behaviour as soon as ts-file loaded
service.enabled(false)

const conf = require('@open-condo/config')
const { nextCamelCaseCSSModulesTransform } = require('@open-condo/miniapp-utils/helpers/webpack')

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

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // NOTE: SWC has an issue: https://github.com/swc-project/swc/issues/8271
    // It means some code may not work as expected, for example zod@4
    // It was fixed in more modern next versions, we'll update it later
    swcMinify: false,
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