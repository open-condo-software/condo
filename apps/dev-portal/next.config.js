const path = require('path')

const { requireTs } = require('./domains/common/utils/requireTs')
const localesPath = path.resolve(__dirname, 'domains/common/constants/locales.ts')
const { LOCALES, DEFAULT_LOCALE } = requireTs(localesPath)

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    i18n: {
        locales: LOCALES,
        defaultLocale: DEFAULT_LOCALE,
    },
    transpilePackages: [
        'antd',
    ],
}

module.exports = nextConfig