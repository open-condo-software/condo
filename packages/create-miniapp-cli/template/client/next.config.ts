import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import { name } from './package.json'

import type { NextConfig } from 'next'

const APP_NAME = name

const nextConfig: NextConfig = {
    reactStrictMode: true,
    skipTrailingSlashRedirect: true,
    env: {
        appName: APP_NAME,
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
    webpack: (config) => {
        return nextCamelCaseCSSModulesTransform(config)
    },
}

export default nextConfig