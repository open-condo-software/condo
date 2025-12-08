import conf from '@open-condo/config'
import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import type { NextConfig } from 'next'


// NOTE: Url of API server
const SERVER_URL = conf['SERVER_URL'] || 'http://localhost:3000'
// NOTE: Url of current service
const SERVICE_URL = conf['SERVICE_URL'] || 'http://localhost:3001'
const CONDO_URL = conf['CONDO_DOMAIN'] || 'http://localhost:4006'
const CORS_ALLOWED_ORIGIN = conf['CORS_ALLOWED_ORIGIN'] || 'https://condo.app.localhost:8006'


const nextConfig: NextConfig = {
    reactStrictMode: true,
    async headers () {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET,HEAD,OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Credentials',
                        value: 'true',
                    },
                ],
            },
        ]
    },
    publicRuntimeConfig:{
        serverUrl: SERVER_URL,
        serviceUrl: SERVICE_URL,
        condoUrl: CONDO_URL,
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