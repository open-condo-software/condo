const { Keystone } = require('@keystonejs/keystone')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { createItems } = require('@keystonejs/server-side-graphql-client')

const conf = require('@core/config')
const { registerSchemas } = require('@core/keystone/schema')
const { prepareDefaultKeystoneConfig } = require('@core/keystone/setup.utils')

const keystone = new Keystone({
    ...prepareDefaultKeystoneConfig(conf),
    onConnect: async () => {
        if (conf.NODE_ENV !== 'development') return // Just for dev purposes!

        // This function can be called before tables are created! (we just ignore this)
        try {
            const users = await keystone.lists.User.adapter.findAll()
            if (!users.length) {
                const initialData = require('./initialData')
                for (let { listKey, items } of initialData) {
                    await createItems({
                        keystone,
                        listKey,
                        items,
                    })
                }
            }
        } catch (e) {
            console.warn('Keystone.onConnect() Error:', e)
        }
    },
})

registerSchemas(keystone, [
    require('./schema/User'),
])

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
})

module.exports = {
    keystone,
    apps: [
        new GraphQLApp(),
        new AdminUIApp({
            authStrategy,
            enableDefaultRoute: true,
        }),
    ],
}
