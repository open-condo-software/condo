const conf = require('@core/config')
const withLess = require('@zeit/next-less')
const withCSS = require('@zeit/next-css')
const { antGlobalVariables } = require('@condo/domains/common/constants/style')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')
const withSourceMaps = require('@zeit/next-source-maps')

// Tell webpack to compile the "@core/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module
const withTM = require('next-transpile-modules')(['@core/next', '@core/keystone', 'rc-table', '@condo/domains'])

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const apolloGraphQLUrl = `${serverUrl}/admin/api`
const firebaseConfig = conf['FIREBASE_CONFIG'] && JSON.parse(conf['FIREBASE_CONFIG'])
const addressSuggestionsConfig = conf['ADDRESS_SUGGESTIONS_CONFIG'] && JSON.parse(conf['ADDRESS_SUGGESTIONS_CONFIG'])
const sentryDsn = conf['SENTRY_DSN']
const isProduction = conf['NODE_ENV'] === 'production'
const mapApiKey = conf['MAP_API_KEY']

module.exports = withSourceMaps(withTM(withLess(withCSS({
    publicRuntimeConfig: {
        // Will be available on both server and client
        sentryDsn,
        serverUrl,
        isProduction,
        firebaseConfig,
        apolloGraphQLUrl,
        addressSuggestionsConfig,
        mapApiKey,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
        modifyVars: antGlobalVariables,
    },
    webpack: (config, options) => {
        if (!options.isServer) {
            config.resolve.alias['@sentry/node'] = '@sentry/browser'
        }

        if (sentryDsn && isProduction) {
            config.plugins.push(
                new SentryWebpackPlugin({
                    include: '.next',
                    ignore: ['node_modules'],
                    urlPrefix: '~/_next',
                })
            )
        }

        return config
    },
    productionBrowserSourceMaps: true,
}))))
