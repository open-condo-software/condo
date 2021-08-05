const Sentry = require('@sentry/node')
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
const express = require('express')
const bodyParser = require('body-parser')

const { formatError } = require('@condo/domains/common/utils/apolloErrorFormatter')

const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production'
const IS_ENABLE_APOLLO_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'
// NOTE: should be disabled in production: https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/
// WARN: https://github.com/graphql/graphql-playground/tree/main/packages/graphql-playground-html/examples/xss-attack
const IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND = conf.ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND === 'true'
const IS_SENTRY_ENABLED = conf.SENTRY_BACKEND_DSN && conf.NODE_ENV !== 'test'

if (IS_SENTRY_ENABLED) {
    // https://docs.sentry.io/platforms/node/guides/express/
    Sentry.init({
        dsn: conf.SENTRY_BACKEND_DSN,
    })
}

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
])

registerTasks([
    require('@condo/domains/notification/tasks'),
])

registerTriggers([
    require('@condo/domains/ticket/triggers'),
])

function verifySchema (keystone) {
    let errorCounter = 0
    const report = (msg) => console.warn(`WRONG-SCHEMA-DEFINITION[${errorCounter}]: ${msg}`)
    Object.entries(keystone.lists).forEach(([key, list]) => {
        list.fields.forEach((field) => {
            if (field.isRelationship && !field.many) {
                const { kmigratorOptions, knexOptions } = field.config
                if (!kmigratorOptions || typeof kmigratorOptions !== 'object') {
                    report(`${list.key}->${field.path} relation without kmigratorOptions`)
                } else {
                    if (!kmigratorOptions.on_delete) {
                        report(`${list.key}->${field.path} relation without on_delete! Example: "kmigratorOptions: { null: false, on_delete: 'models.CASCADE' }". Chose one: CASCADE, PROTECT, SET_NULL, DO_NOTHING`)
                    }
                    if (kmigratorOptions.null === false) {
                        if (!knexOptions || typeof knexOptions !== 'object' || knexOptions.isNotNullable !== true) {
                            report(`${list.key}->${field.path} non nullable relation should have knexOptions like: "knexOptions: { isNotNullable: true }"`)
                        }
                        if (knexOptions.on_delete) {
                            report(`${list.key}->${field.path} knexOptions should not contain on_delete key!`)
                        }
                    }
                }
            }
        })
    })
    if (errorCounter > 0) throw new Error(`Your have ${errorCounter} WRONG-SCHEMA-DEFINITION! Fix it first!`)
}

verifySchema(keystone)

const authStrategy = keystone.createAuthStrategy({
    type: PasswordAuthStrategy,
    list: 'User',
    config: {
        protectIdentities: false,
    },
})

class OBSFilesMiddleware {
    prepareMiddleware ({ keystone, dev, distDir }) {
        const app = express()
        app.use('/api/files/:file(*)', obsRouterHandler({ keystone }))
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

class SentryApp {
    prepareMiddleware () {
        // The error handler must be before any other error middleware and after all controllers
        return Sentry.Handlers.errorHandler()
    }
}

class SentryFallthroughApp {
    prepareMiddleware () {
        // The error id is attached to `res.sentry` to be returned
        // and optionally displayed to the user for support.
        return function onError (err, req, res, next) {
            // The error id is attached to `res.sentry` to be returned
            // and optionally displayed to the user for support.
            res.statusCode = 500
            res.end(res.sentry + '\n')
        }
    }
}

class SentryApolloPlugin {
    // https://blog.sentry.io/2020/07/22/handling-graphql-errors-using-sentry
    didEncounterErrors (ctx) {
        // NOTE(pahaz): if you want understand whats going on here look at: https://github.com/apollographql/apollo-server/blob/0aa0e4b/packages/apollo-server-core/src/requestPipeline.ts#L126
        // NOTE(pahaz): we don't want to catch GraphQL syntax errors. Look at: https://github.com/apollographql/apollo-server/blob/0aa0e4b/packages/apollo-server-core/src/requestPipeline.ts#L344
        if (!ctx.operation) {
            return
        }

        // public user email

        Sentry.withScope(scope => {
            // Annotate whether failing operation was query/mutation/subscription
            // Log query and variables as extras
            // (make sure to strip out sensitive data!)
            scope.addEventProcessor(event => Sentry.Handlers.parseRequest(event, req))
            scope.setTags({
                graphql: ctx.operation.operation,
            })
            scope.setExtras({
                variables: ctx.request.variables,
                query: ctx.request.query,
            })

            const userId = (ctx.context).req?.session?.userId
            const email = (ctx.context).req?.session?.email
            if (userId) {
                scope.setUser({
                    // id?: string;
                    ip_address: (ctx.context).req?.ip,
                    userId: userId,
                    email: email,
                })
            }

        })

        for (const error of ctx.errors) {
            // NOTE: each error has fields: stack locations name message time_thrown path internalData data
            Sentry.withScope(scope => {
                scope.setExtras({
                    uid: error.uid,
                    extensions: error.extensions,
                    path: error.path,
                    locations: error.locations,
                    developerMessage: error.developerMessage,
                    data: error.data,
                    internalData: error.internalData,
                    errors: error.errors,
                    time_thrown: error.time_thrown,
                })
            })
            Sentry.captureException(error)
        }
    }

    requestDidStart () {
        return this
    }
}

module.exports = {
    configureExpress: (app) => {
        if (IS_SENTRY_ENABLED) {
            // The request handler must be the first middleware on the app
            app.use(Sentry.Handlers.requestHandler())
            app.get('/debug-sentry', function mainHandler (req, res) {
                throw new Error('My first Sentry error!')
            })
        }
    },
    keystone,
    apps: [
        new CustomBodyParserMiddleware(),
        new GraphQLApp({
            apollo: {
                formatError,
                debug: IS_ENABLE_APOLLO_DEBUG,
                introspection: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                playground: IS_ENABLE_DANGEROUS_GRAPHQL_PLAYGROUND,
                plugins: [new SentryApolloPlugin()],
            },
        }),
        new OBSFilesMiddleware(),
        new AdminUIApp({
            adminPath: '/admin',
            isAccessAllowed: ({ authentication: { item: user } }) => Boolean(user && (user.isAdmin || user.isSupport)),
            authStrategy,
        }),
        conf.NODE_ENV === 'test' ? undefined : new NextApp({ dir: '.' }),
        (IS_SENTRY_ENABLED) ? new SentryApp() : undefined,
        (IS_SENTRY_ENABLED) ? new SentryFallthroughApp() : undefined,
    ].filter(identity),
}
