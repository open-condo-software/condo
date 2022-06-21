const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

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

    async loadListByChunks (list, where, sortBy, chunkSize, limit) {
        return await loadListByChunks({
            context: this.context,
            list,
            where,
            sortBy,
            chunkSize,
            limit,
        })
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