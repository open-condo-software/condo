import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import { version } from './package.json'

import type { NextConfig } from 'next'

// Public environment variables accessible from client-side and server-side
const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'ru'
const CONDO_DOMAIN = process.env.NEXT_PUBLIC_CONDO_DOMAIN || 'https://condo.d.doma.ai'
const REVISION = process.env.NEXT_PUBLIC_REVISION ||  version
const OIDC_CLIENT_ID = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'oidc-condo-api-example'
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Private environment variables accessible only from server-side
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET
const COOKIE_SECRET = process.env.COOKIE_SECRET

const nextConfig: NextConfig = {
    reactStrictMode: true,
    publicRuntimeConfig: {
        defaultLocale: DEFAULT_LOCALE,
        condoDomain: CONDO_DOMAIN,
        serverUrl: SERVER_URL,
        revision: REVISION,
        oidcClientId: OIDC_CLIENT_ID,
    },
    serverRuntimeConfig: {
        cookieSecret: COOKIE_SECRET,
        oidcClientSecret: OIDC_CLIENT_SECRET,
    },
    images: {
        unoptimized: true,
    },
    webpack: (config) => {
        return nextCamelCaseCSSModulesTransform(config)
    },
}

export default nextConfig
