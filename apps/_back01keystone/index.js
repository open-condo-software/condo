const { Keystone } = require('@keystonejs/keystone')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { StaticApp } = require('@keystonejs/app-static')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { getAdapter } = require('@core/keystone/adapter.utils')
const { getCookieSecret } = require('@core/keystone/keystone.utils')
const { registerSchemas } = require('@core/keystone/schema')
const conf = require('@core/config')
const { createItems } = require('@keystonejs/server-side-graphql-client')

const keystone = new Keystone({
    cookieSecret: getCookieSecret(conf.COOKIE_SECRET),
    cookie: {
        sameSite: false,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 130, // 130 days
    },
    name: conf.PROJECT_NAME,
    adapter: getAdapter(conf.DATABASE_URL),
    defaultAccess: { list: false, field: true, custom: false },
    queryLimits: { maxTotalResults: 1000 },
    onConnect: async () => {
        if (conf.NODE_ENV !== 'development') return // Just for dev purposes!

        // This function can be called before tables are created! (we just ignore this)
        try {
            const users = await keystone.lists.User.adapter.findAll()
            if (!users.length) {
                const initialData = require('./initial-data')
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
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({ authStrategy, enableDefaultRoute: true })],
}
