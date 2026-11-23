import conf from '@open-condo/config'
import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import { version } from './package.json'

import type { NextConfig } from 'next'

// Public environment variables accessible from client-side and server-side
const DEFAULT_LOCALE = conf['DEFAULT_LOCALE'] || 'ru'
const CONDO_DOMAIN = conf['CONDO_DOMAIN'] || 'https://condo.app.localhost:8009'
const REVISION = conf['REVISION'] ||  version
const OIDC_CLIENT_ID = conf['OIDC_CLIENT_ID'] || 'oidc-condo-api-example'
const SERVER_URL = conf['SERVER_URL'] || 'http://localhost:3000'

// Private environment variables accessible only from server-side
const OIDC_CLIENT_SECRET = conf['OIDC_CLIENT_SECRET']
const COOKIE_SECRET = conf['COOKIE_SECRET']

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
