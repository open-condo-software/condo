import type { NextConfig } from 'next'

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'ru'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'export',
    publicRuntimeConfig: {
        defaultLocale: DEFAULT_LOCALE,
    },
    images: {
        unoptimized: true,
    },
}

export default nextConfig
