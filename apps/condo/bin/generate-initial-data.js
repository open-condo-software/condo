const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')

class InitialDataGenerator {
    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
    }
}

if (process.env.NODE_ENV === 'production') {
    console.log('NODE_ENV should not have value "production"')
    process.exit(1)
}

const generateInitialData = async () => {
    const initialDataGenerator = new InitialDataGenerator()
    await initialDataGenerator.connect()
}

generateInitialData().then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
