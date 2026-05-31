import conf from '@open-condo/config'
import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import type { NextConfig } from 'next'

function getEnvOrFallback (name: string, fallback: string) {
    const value = conf[name]
    if (value) return value

    if (conf['NODE_ENV'] === 'production') {
        throw new Error(`[create-miniapp-cli] Missing required env: ${name}`)
    }

    console.warn(`[create-miniapp-cli] Missing env ${name}. Fallback will be used: ${fallback}`)
    return fallback
}

const serverUrl = getEnvOrFallback('CONDO_DOMAIN', 'http://localhost:4006')
const serviceUrl = getEnvOrFallback('SERVICE_URL', 'http://localhost:3000')
const apolloGraphQLUrl = `${serviceUrl}/api/graphql`
const defaultLocale = conf['DEFAULT_LOCALE'] || 'en'
const sessionSecretKey = conf['SESSION_SECRET_KEY']

const nextConfig: NextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@open-condo/next',
        '@open-condo/codegen',
        '~/domains',
        '@app/~',
        '@app/condo',
    ],
    publicRuntimeConfig: {
        serverUrl,
        serviceUrl,
        apolloGraphQLUrl,
        defaultLocale,
    },
    serverRuntimeConfig: {
        sessionSecretKey,
    },
    webpack: (config) => {
        config.module.rules = [
            ...(config.module.rules || []),
            {
                test: /[\\/]lang[\\/].*\.njk$/,
                type: 'asset/source',
            },
        ]
        return nextCamelCaseCSSModulesTransform(config)
    },
}

export default nextConfig
