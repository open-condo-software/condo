import conf from '@open-condo/config'
import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import type { NextConfig } from 'next'

const serverUrl = conf['SERVER_URL']
// @if STITCH
const apolloGraphQLUrl = `${serverUrl}/graphql`
// @endif
// @if NOT_STITCH
const apolloGraphQLUrl = `${serverUrl}/admin/api`
// @endif
const condoUrl = conf['CONDO_DOMAIN'] || serverUrl
const defaultLocale = conf['DEFAULT_LOCALE'] || 'en'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@open-condo/codegen',
        '@open-condo/next',
        '~/domains',
        '@app/~',
        '@app/condo',
    ],
    publicRuntimeConfig: {
        serverUrl,
        apolloGraphQLUrl,
        condoUrl,
        defaultLocale,
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
