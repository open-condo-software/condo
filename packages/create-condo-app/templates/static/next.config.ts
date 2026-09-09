import { version } from './package.json'

import type { NextConfig } from 'next'

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'ru'
const CONDO_DOMAIN = process.env.NEXT_PUBLIC_CONDO_DOMAIN || 'https://condo.d.doma.ai'
const REVISION = process.env.NEXT_PUBLIC_REVISION ||  version

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'export',
    publicRuntimeConfig: {
        defaultLocale: DEFAULT_LOCALE,
        condoDomain: CONDO_DOMAIN,
        revision: REVISION,
    },
    images: {
        unoptimized: true,
    },
}

export default nextConfig
