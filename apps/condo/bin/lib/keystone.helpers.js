const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')

async function connectKeystone () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    return keystone
}

module.exports = {
    connectKeystone,
}