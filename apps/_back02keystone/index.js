const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
// const { NextApp } = require('@keystonejs/app-next')
const { StaticApp } = require('@keystonejs/app-static')
const express = require('express')
const access = require('@core/keystone/access')
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
        // Initialise some data
        if (conf.NODE_ENV !== 'development') return // Just for dev env purposes!
        // This function can be called before tables are created! (we just ignore this)
        try {
            const users = await keystone.lists.User.adapter.findAll()
            if (!users.length) {
                const initialData = require('./initial-data')
                for (let { listKey, items } of initialData) {
                    console.log(`🗿 createItems(${listKey}) -> ${items.length}`)
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
    require('./schema/Test'),
    require('./schema/Todo'),
])

keystone.extendGraphQLSchema({
    types: [{ type: 'type FooBar { foo: Int, bar: Float }' }],
    queries: [
        {
            schema: 'getUserByName(name: String!): Boolean',
            resolver: async (item, context, info) => 'hohoho',
            access: true,
        },
    ],
    mutations: [
        {
            schema: 'double(x: Int): Int',
            resolver: (_, { x }) => 2 * x,
            access: ({ authentication: { item, listKey } }) => {
                return true
            },
        },
    ],
})

class CustomApp {
    prepareMiddleware ({ keystone, dev, distDir }) {
        const middleware = express()
        return middleware
    }
}

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
})

module.exports = {
    configureExpress: (app) => {
    },
    keystone,
    apps: [
        new CustomApp(),
        new GraphQLApp(),
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({
            adminPath: '/admin',
            hooks: require.resolve('./admin-ui/'),
            // enableDefaultRoute: true,
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
        }),
        // TODO(pahaz): remove it! Multi server is better!
        // (conf.INCLUDE_NEXT_APP && !areWeRunningTests()) ? new NextApp({ dir: conf.INCLUDE_NEXT_APP }) : new CustomApp(),
    ],
}
