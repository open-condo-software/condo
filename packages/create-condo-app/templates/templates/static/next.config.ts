import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import { version } from './package.json'

import type { NextConfig } from 'next'

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'ru'
const CONDO_DOMAIN = process.env.NEXT_PUBLIC_CONDO_DOMAIN || 'https://condo.d.doma.ai'
const REVISION = process.env.NEXT_PUBLIC_REVISION ||  version
const OIDC_CLIENT_ID = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'oidc-condo-api-example'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Disable static export in dev mode to allow middleware
    output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
    publicRuntimeConfig: {
        defaultLocale: DEFAULT_LOCALE,
        condoDomain: CONDO_DOMAIN,
        revision: REVISION,
        oidcClientId: OIDC_CLIENT_ID,
    },
    images: {
        unoptimized: true,
    },
    webpack: (config) => {
        return nextCamelCaseCSSModulesTransform(config)
    },
}

export default nextConfig
