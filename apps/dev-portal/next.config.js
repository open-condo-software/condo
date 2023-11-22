const path = require('path')

const get = require('lodash/get')
const set = require('lodash/set')

const { requireTs } = require('./domains/common/utils/requireTs')
const localesPath = path.resolve(__dirname, 'domains/common/constants/locales.ts')
const { LOCALES, DEFAULT_LOCALE } = requireTs(localesPath)

const DOCS_ENTRY_ENDPOINT = process.env.DOCS_ENTRY_ENDPOINT || '/docs/index'
// NOTE: Url of API server
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4006'
// NOTE: Url of current service
const SERVICE_URL = process.env.DEV_PORTAL_DOMAIN || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    i18n: {
        locales: LOCALES,
        defaultLocale: DEFAULT_LOCALE,
    },
    transpilePackages: [
        'antd',
    ],
    publicRuntimeConfig: {
        serverUrl: SERVER_URL,
        serviceUrl: SERVICE_URL,
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