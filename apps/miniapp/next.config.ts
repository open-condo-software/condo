import withLess from 'next-with-less'

import conf from '@open-condo/config'
import { nextCamelCaseCSSModulesTransform } from '@open-condo/miniapp-utils/helpers/webpack'

import { antGlobalVariables } from '@app/condo/domains/common/constants/style'
import { DEFAULT_LOCALE } from '@miniapp/domains/common/constants'

import type { NextConfig } from 'next'


const serverUrl = conf['SERVER_URL']
const apolloGraphQLUrl = `${serverUrl}/graphql`
const condoUrl = conf['CONDO_DOMAIN']
const b2bAppId = conf['CONDO_B2B_APP_ID'] || null
const defaultLocale = DEFAULT_LOCALE


const nextConfig: NextConfig = {
    transpilePackages: [
        '@open-condo/codegen',
        '@open-condo/next',
        '@app/condo',
        '@miniapp/domains',
    ],
    compiler: {
        emotion: true,
    },
    lessLoaderOptions: {
        lessOptions: {
            javascriptEnabled: true,
            modifyVars: antGlobalVariables,
        },
    },
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
        condoUrl,
        b2bAppId,
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

export default withLess(nextConfig)