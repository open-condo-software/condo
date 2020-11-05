require('@core/config')
const withLess = require('@zeit/next-less')
const withCSS = require('@zeit/next-css')
const withTM = require('next-transpile-modules')(['@core/next'])

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const apolloGraphQLUrl = `${serverUrl}/admin/api`

module.exports = withTM(withLess(withCSS({
    publicRuntimeConfig: {
        serverUrl,
        apolloGraphQLUrl,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
    },
})))
