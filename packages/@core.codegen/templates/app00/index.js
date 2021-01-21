const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { NextApp } = require('@keystonejs/app-next')
const { StaticApp } = require('@keystonejs/app-static')
const access = require('@core/keystone/access')
const { getAdapter } = require('@core/keystone/adapter.utils')
const { getCookieSecret } = require('@core/keystone/keystone.utils')
const { registerSchemas } = require('@core/keystone/schema')
const conf = require('@core/config')
const { areWeRunningTests, EmptyApp } = require('@core/keystone/test.utils')
const { createItems } = require('@keystonejs/server-side-graphql-client')

const keystone = new Keystone({
    name: conf.PROJECT_NAME,
    cookieSecret: getCookieSecret(conf.COOKIE_SECRET),
    cookie: {
        sameSite: false,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 130, // 130 days
    },
    adapter: getAdapter(conf.DATABASE_URL),
    defaultAccess: { list: false, field: true, custom: false },
    queryLimits: { maxTotalResults: 1000 },
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development') return // Just for dev env purposes!
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
            console.warn('onConnectError:', e)
        }
    },
})

registerSchemas(keystone, [
    require('./schema/User'),
    require('./schema/Organization'),
])

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
})

module.exports = {
    keystone,
    apps: [
        new GraphQLApp({ apollo: { debug: conf.NODE_ENV === 'development' } }),
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
        }),
        !areWeRunningTests() ? new NextApp({ dir: '.' }) : new EmptyApp(),
    ],
}
