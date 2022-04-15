const conf = require('@core/config')
const withLess = require('@zeit/next-less')
const withCSS = require('@zeit/next-css')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')
// Tell webpack to compile the "@core/next" package, necessary
// https://www.npmjs.com/package/next-transpile-modules
// NOTE: FormTable require rc-table module
// TODO(codegen): include all TypeScript modules, that you plan to use in your app, otherwise you will get errors about unregognized TypeScript syntax
const withTM = require('next-transpile-modules')(['@core/next', '@app/condo', '@condo/domains', '@app/{{name}}', '@{{name}}/domains', 'rc-table'])

const serverUrl = conf['SERVER_URL']
const apolloGraphQLUrl = `${serverUrl}/admin/api`

module.exports = withTM(withLess(withCSS({
    publicRuntimeConfig: {
        // Will be available on both server and client
        serverUrl,
        apolloGraphQLUrl,
    },
    lessLoaderOptions: {
        javascriptEnabled: true,
    },
    webpack: (config) => {
        const plugins = config.plugins

        // NOTE: Replace Moment.js with Day.js in antd project
        config.plugins = [ ...plugins, new AntdDayjsWebpackPlugin() ]

        config.module.rules = [
            ...(config.module.rules || []),
            { test: /lang\/.*\.njk$/, use: 'raw-loader' },
        ]

        return config
    },
})))
