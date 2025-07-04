const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')

class ScriptCore {
    context = null

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        // we need only apollo
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async proceed () {
        throw new Error('Please redefine proceed method within implementation class.')
    }
}

const runFnWithArgs = (main) => {
    main(process.argv.slice(2)).then(() => {
        console.log('\r\n')
        console.log('All done')
        process.exit(0)
    }).catch((err) => {
        console.error('Failed to proceed', err)
        process.exit(1)
    })
}

module.exports = {
    ScriptCore,
    runFnWithArgs,
}