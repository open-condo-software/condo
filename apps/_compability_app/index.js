const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { Keystone } = require('@keystonejs/keystone')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { StaticApp } = require('@keystonejs/app-static')
const { NextApp } = require('@keystonejs/app-next')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { getAdapter } = require('@core/keystone/adapter.utils')
const { registerSchemas } = require('@core/keystone/schema')
const conf = require('@core/config')
const fs = require('fs')

const keystone = new Keystone({
    name: conf.PROJECT_NAME,
    adapter: getAdapter(conf.DATABASE_URL),
    defaultAccess: { list: false, field: true, custom: false },
    queryLimits: { maxTotalResults: 1000 },
    onConnect: async () => {
        if (conf.NODE_ENV !== 'development') return // Just for dev purposes!

        // This function can be called before tables are created! (we just ignore this)
        try {
            const users = await keystone.lists.User.adapter.findAll()
            /*
            * Подумать над идеей парсера тестова для initial-data;
            * */

            const source_dir = './db_source'

            fs.readdirSync(source_dir).forEach(async file => {
                const initialData = require(`${source_dir}/${file}`)
                    await keystone.createItems(initialData)
            });
        } catch (e) {
            console.warn('Keystone.onConnect() Error:', e)
        }
    },
})

registerSchemas(keystone, [
    require('./schema/Test'),
    require('./schema/User'),
    require('./schema/Answer'),
    require('./schema/Question'),
])

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
})

module.exports = {
    keystone,
    apps: [
        new GraphQLApp(),
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({ authStrategy }),
        new NextApp({ dir: '.' }),
    ],
}
