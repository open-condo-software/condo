const { identity } = require('lodash')
const { Keystone } = require('@keystonejs/keystone')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { NextApp } = require('@keystonejs/app-next')
const { registerTriggers } = require('@core/triggers')
const { createItems } = require('@keystonejs/server-side-graphql-client')
const { obsRouterHandler } = require('@condo/domains/common/utils/sberCloudFileAdapter')
const conf = require('@core/config')
// const access = require('@core/keystone/access')
const { registerTasks } = require('@core/keystone/tasks')
const { prepareDefaultKeystoneConfig } = require('@core/keystone/setup.utils')
const { registerSchemas } = require('@core/keystone/schema')
const { accessControl } = require('@condo/domains/common/utils/accessControl')
const express = require('express')
const bodyParser = require('body-parser')
const nextCookie = require('next-cookies')
const { makeId } = require('@condo/domains/common/utils/makeid.utils')
const { formatError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')

const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production'
const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'
// NOTE: should be disabled in production: https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/
// WARN: https://github.com/graphql/graphql-playground/tree/main/packages/graphql-playground-html/examples/xss-attack
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'
const { SbbolRoutes } = require('@condo/domains/organization/integrations/sbbol/routes')



if (IS_ENABLE_DD_TRACE) {
    require('dd-trace').init({
        logInjection: true,
    })
}

const keystone = new Keystone({
    ...prepareDefaultKeystoneConfig(conf),
    onConnect: async () => {
        // Initialise some data
        if (conf.NODE_ENV !== 'development' && conf.NODE_ENV !== 'test') return // Just for dev env purposes!
        // This function can be called before tables are created! (we just ignore this)
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
    },
})

registerSchemas(keystone, [
    require('@condo/domains/user/schema'),
    require('@condo/domains/organization/schema'),
    require('@condo/domains/property/schema'),
    require('@condo/domains/billing/schema'),
    require('@condo/domains/ticket/schema'),
    require('@condo/domains/notification/schema'),
    require('@condo/domains/contact/schema'),
    require('@condo/domains/resident/schema'),
    require('@condo/domains/onboarding/schema'),
    require('@condo/domains/division/schema'),
    require('@condo/domains/meter/schema'),
    require('@condo/domains/subscription/schema'),
    require('@condo/domains/acquiring/schema'),
], [accessControl])

registerTasks([
    require('@condo/domains/notification/tasks'),
    require('@condo/domains/organization/tasks'),
])

registerTriggers([
    require('@condo/domains/ticket/triggers'),
])

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
    config: {
        protectIdentities: false,
    },
})

class OBSFilesMiddleware {
    prepareMiddleware ({ keystone }) {
        const app = express()
        app.use('/api/files/:file(*)', obsRouterHandler({ keystone }))
        return app
    }
}

class SberBuisnessOnlineMiddleware {
    prepareMiddleware () {
        const Auth = new SbbolRoutes()
        const app = express()
        // TODO(zuch): find a way to remove bind
        app.get('/api/sbbol/auth', Auth.startAuth.bind(Auth))
        app.get('/api/sbbol/auth/callback',  Auth.completeAuth.bind(Auth))
        return app
    }
}

/**
 * We need a custom body parser for custom file upload limit
 */
class CustomBodyParserMiddleware {
    prepareMiddleware ({ keystone, dev, distDir }) {
        const app = express()
        app.use(bodyParser.json({ limit: '100mb', extended: true }))
        app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))
        return app
    }
}


module.exports = {
    keystone,
    apps: [
        new CustomBodyParserMiddleware(),
        new GraphQLApp({
            apollo: {
                formatError,
                debug: IS_ENABLE_APOLLO_DEBUG,
                introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
            },
        }),
        new OBSFilesMiddleware(),
        new SberBuisnessOnlineMiddleware(),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport)),
            authStrategy,
        }),
        conf.NODE_ENV === 'test' ? undefined : new NextApp({ dir: '.' }),
    ].filter(identity),
    /** @type {(app: import('express').Application) => void} */
    configureExpress: (app) => {
        app.use('/admin/', (req, res, next) => {
            if (req.url === '/api') return next()
            const cookies = nextCookie({ req })
            let isSenderValid = true

            isSenderValid = hasValidJsonStructure(
                {
                    resolvedData: { sender: cookies['sender'] },
                    fieldPath: 'sender',
                    addFieldValidationError: () => null,
                },
                true,
                1,
                {
                    fingerprint: {
                        presence: true,
                        format: /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/,
                        length: { minimum: 5, maximum: 42 },
                    },
                })
            if (!isSenderValid) {
                res.cookie('sender', JSON.stringify({ fingerprint: makeId(12), dv: 1 }))
                res.cookie('dv', 1)
            }
            next()
        })
    },
}
