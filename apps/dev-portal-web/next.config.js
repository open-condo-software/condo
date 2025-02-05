const path = require('path')

const get = require('lodash/get')
const set = require('lodash/set')

const conf = require('@open-condo/config')

const { requireTs } = require('./domains/common/utils/requireTs')
const localesPath = path.resolve(__dirname, 'domains/common/constants/locales.ts')
const { LOCALES, DEFAULT_LOCALE } = requireTs(localesPath)

const DOCS_ENTRY_ENDPOINT = conf['DOCS_ENTRY_ENDPOINT'] || '/docs/index'
// NOTE: Url of API server
const SERVER_URL = conf['DEV_API_DOMAIN'] || 'http://localhost:4006'
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
    swcMinify: true,
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
        const rules = get(config, ['module', 'rules'], [])

        const newRules = rules.map(rule => {
            if (!rule.oneOf) {
                return rule
            }

            rule.oneOf = rule.oneOf.map(option => {
                if (option && option.test && typeof option.test.test === 'function' &&
                    option.test.test('my.module.css') && Array.isArray(option.use)) {
                    option.use = option.use.map(loader => {
                        if (typeof loader.loader === 'string' && loader.loader.includes('/css-loader')) {
                            set(loader, ['options', 'modules', 'exportLocalsConvention'], 'camelCase')
                        }

                        return loader
                    })
                }

                return option
            })

            return rule
        })

        set(config, ['module', 'rules'], newRules)

        return config
    },
}

module.exports = nextConfig