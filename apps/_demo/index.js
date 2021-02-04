const express = require('express')
const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { StaticApp } = require('@keystonejs/app-static')
const { NextApp } = require('@keystonejs/app-next')
const { createItems } = require('@keystonejs/server-side-graphql-client')

const conf = require('@core/config')
const access = require('@core/keystone/access')
const { areWeRunningTests } = require('@core/keystone/test.utils')
const { EmptyApp } = require('@core/keystone/test.utils')
const { prepareDefaultKeystoneConfig } = require('@core/keystone/setup.utils')
const { registerSchemas } = require('@core/keystone/schema')

const keystone = new Keystone({
    ...prepareDefaultKeystoneConfig(conf),
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development') return // Just for dev env purposes!
        // This function can be called before tables are created! (we just ignore this)
        try {
            const users = await keystone.lists.User.adapter.findAll()
            if (!users.length) {
                const initialData = require('./initialData')
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
    require('./schema/Auth'),
    require('./schema/Test'),
])

class CustomAppExample {
    prepareMiddleware ({ keystone, dev, distDir }) {
        const app = express()
        app.use(function (req, res, next) {
            req._CustomApp_requestLevelData = { foo: 22 }
            // console.log('Time:', Date.now())
            next()
        })
        return app
    }
}

class CustomGQLPluginExample {
    serverWillStart () {
        console.log('Server starting!')
    }

    requestDidStart (requestContext) {
        if (conf.NODE_ENV !== 'production') return
        // console.log('GQL!o :', requestContext.operation)
        console.log('GQL!op:', requestContext.request.operationName)
        console.log('GQL!q :', requestContext.request.query.replace(/\n/g, '').replace(/\s+/g, ' '))
        // console.log('GQL!v :', requestContext.request.variables)
        // console.log('GQL!u :', requestContext.context.authedItem && requestContext.context.authedItem.id)
        // console.log('GQL!l :', requestContext.context.authedListKey)
        // console.log('req!req:', requestContext.context.req)
        const { req } = requestContext.context
        // console.log('REQ.body:', req.body)
        // console.log('REQ.query:', req.query)
        // console.log('REQ.cookies:', req.cookies)
        // console.log('REQ.hostname:', req.hostname)
        // console.log('REQ.headers:', req.headers)
        // console.log('REQ.rawHeaders:', req.rawHeaders)
        console.log('REQ.ip:', req.ip)
        // console.log('REQ.ips:', req.ips)
        console.log('REQ.protocol:', req.protocol)
        // console.log('REQ.method:', req.method)
        console.log('REQ.sessionID:', req.sessionID)
        console.log('REQ.id:', req.id)
        // console.log('REQ.originalUrl:', req.originalUrl)
        // console.log('REQ.url:', req.url)
        // console.log('Request starting!', requestContext)
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
        new CustomAppExample(),
        new GraphQLApp({
            apollo: {
                debug: conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test',
                plugins: [new CustomGQLPluginExample()],
            },
        }),
        new StaticApp({ path: conf.MEDIA_URL, src: conf.MEDIA_ROOT }),
        new AdminUIApp({
            adminPath: '/admin',
            // enableDefaultRoute: true,
            isAccessAllowed: access.userIsAdmin,
            authStrategy,
        }),
        !areWeRunningTests() ? new NextApp({ dir: '.' }) : new EmptyApp(),
    ],
}
