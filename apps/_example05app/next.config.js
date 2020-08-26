const conf = require('@core/config')
const withLess = require('@zeit/next-less')
const withCSS = require('@zeit/next-css')
// Tell webpack to compile the "@core/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
const withTM = require('next-transpile-modules')(['@core/next'])

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
const apolloGraphQLUrl = `${serverUrl}/admin/api`
const firebaseConfig = conf['FIREBASE_CONFIG'] && JSON.parse(conf['FIREBASE_CONFIG'])

module.exports = withTM(withLess(withCSS({
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
        firebaseConfig,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
    },
})))
