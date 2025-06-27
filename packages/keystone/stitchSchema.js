const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader')
const { GraphQLUpload } = require('@graphql-tools/links')
const { loadSchema } = require('@graphql-tools/load')
const { stitchSchemas } = require('@graphql-tools/stitch')
const { RenameTypes, RenameRootFields } = require('@graphql-tools/wrap')
const bodyParser = require('body-parser')
const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const FormData = require('form-data')
const { print } = require('graphql')
const NoIntrospectionRule = require('graphql-disable-introspection')
const graphqlUploadExpress = require('graphql-upload/graphqlUploadExpress.js')
const { isObject, get } = require('lodash')
const nextCookie = require('next-cookies')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')


const CONDO_ACCESS_TOKEN_KEY = 'condoAccessToken'
const APP_TOKEN_KEY = 'appToken'
const ACCEPT_LANGUAGE_KEY = 'accept-language'
const COOKIES_KEY = 'cookies'
// NOTE: DEFAULT VALUES OF GraphQLApp
const MAX_FILE_SIZE = 200 * 1024 * 1024
const MAX_FILES = 5


function streamToBuffer (stream) {
    const chunks = []
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        stream.on('error', (error) => reject(error))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
}

function isPromise (promise) {
    return promise && Object.prototype.toString.call(promise) === '[object Promise]'
}

async function packVariablesRecursively (rawVariables, prefix = ['variables'], maps = []) {
    const variables = {}
    for (const key of Object.keys(rawVariables)) {
        const pathParts = [...prefix, key]
        const path = pathParts.join('.')
        if (typeof rawVariables[key] !== 'object') {
            variables[key] = rawVariables[key]
        } else if (rawVariables[key] === null) {
            variables[key] = null
        } else if (isPromise(rawVariables[key])) {
            const file = await rawVariables[key]
            maps.push({
                key: path,
                file,
            })
            variables[key] = null
        } else if (Array.isArray(rawVariables[key])) {
            variables[key] = []
            for (let i = 0; i < rawVariables[key].length; i++) {
                const { variables: packedVariables } = await packVariablesRecursively(rawVariables[key][i], [...pathParts, `${i}`], maps)
                variables[key].push(packedVariables)
            }
        } else {
            const { variables: packedVariables } = await packVariablesRecursively(rawVariables[key], pathParts, maps)
            variables[key] = packedVariables
        }
    }

    return { variables, maps }
}

function makeRemoteExecutor (api_url, token_field) {
    return async ({ document, variables, context }) => {
        const query = typeof document === 'string' ? document : print(document)

        const headers = {}
        if (context && context[ACCEPT_LANGUAGE_KEY]) {
            headers[ACCEPT_LANGUAGE_KEY] = context[ACCEPT_LANGUAGE_KEY]
        }
        if (context && context[token_field]) {
            headers.Authorization = `Bearer ${context[token_field]}`
        }
        if (context && isObject(context[COOKIES_KEY])) {
            headers.cookie = Object.entries(context[COOKIES_KEY]).map(([key, value]) => `${key}=${value}`).join('; ')
        }

        const { maps, variables: packedVariables } = await packVariablesRecursively(variables)

        // NO FILES IN REQUEST -> SEND JSON REQUEST
        if (maps.length === 0) {
            headers['Content-Type'] = 'application/json'
            const fetchResult = await fetch(api_url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ query, variables }),
            })

            const status = get(fetchResult, 'status')
            const statusText = get(fetchResult, 'statusText')

            try {
                return { ...await fetchResult.json(), status, statusText }
            } catch (error) {
                return { status, statusText }
            }
        } else {
            // OTHERWISE, SEND MULTI-PART REQUEST
            const form = new FormData()
            form.append('operations', JSON.stringify({ query: query, variables: packedVariables }))

            const map = {}
            for (let i = 0; i < maps.length; i++) {
                map[`${i}`] = [maps[i].key]
            }
            form.append('map', JSON.stringify(map))

            for (let i = 0; i < maps.length; i++) {
                const file = maps[i].file
                const buffer = await streamToBuffer(file.createReadStream())
                form.append(`${i}`, buffer, {
                    filename: file.filename,
                    mimetype: file.mimetype,
                    encoding: file.encoding,
                })
            }

            const fetchResult = await fetch(api_url, {
                method: 'POST',
                headers: headers,
                body: form,
            })

            const status = get(fetchResult, 'status')
            const statusText = get(fetchResult, 'statusText')

            try {
                return { ...await fetchResult.json(), status, statusText }
            } catch (error) {
                return { status, statusText }
            }
        }
    }
}

async function makeGatewaySchema (appTokenKey, condoAccessTokenKey) {
    const appAPIUrl = `${conf.SERVER_URL}/admin/api`
    const condoAPIUrl = `${conf.CONDO_DOMAIN}/admin/api`
    const appExecutor = makeRemoteExecutor(appAPIUrl, appTokenKey)
    const condoExecutor = makeRemoteExecutor(condoAPIUrl, condoAccessTokenKey)

    // NOTE: Resolves schema from index.js, so '.' instead of '..'
    const appSchema = await loadSchema('./schema.graphql', {
        loaders: [new GraphQLFileLoader()],
    })
    const condoSchema = await loadSchema('./condoSchema.graphql', {
        loaders: [new GraphQLFileLoader()],
    })

    return stitchSchemas({
        subschemas: [
            {
                schema: appSchema,
                executor: appExecutor,
            },
            {
                schema: condoSchema,
                executor: condoExecutor,
                transforms: [
                    new RenameTypes((name) => `Condo${name}`),
                    new RenameRootFields((op, name) => `condo${name.charAt(0).toUpperCase()}${name.slice(1)}`),
                ],
            },
        ],
        resolvers: {
            Upload: GraphQLUpload,
        },
    })
}

class StitchSchemaMiddleware {
    /**
     *
     * @param apiUrl {String} graphql main endpoint. Default value: /graphql
     * @param condoAccessTokenKey {String} session key for access token. Default value: condoAccessToken
     * @param appTokenKey {String} session key for app token. Default value: appToken
     */
    constructor ({ apiUrl = '/graphql', condoAccessTokenKey = CONDO_ACCESS_TOKEN_KEY, appTokenKey = APP_TOKEN_KEY }) {
        this.apiUrl = apiUrl
        this.condoAccessTokenKey = condoAccessTokenKey
        this.appTokenKey = appTokenKey
    }

    async prepareMiddleware () {
        // creates middleware - no routes exposed
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        const schema = await makeGatewaySchema(this.appTokenKey, this.condoAccessTokenKey)

        app.post(
            this.apiUrl,
            bodyParser.json(),
            graphqlUploadExpress({ maxFiles: MAX_FILES, maxFileSize: MAX_FILE_SIZE }),
            // TODO(INFRA-280): migrate from graphqlHttp to Apollo server for client-side batching support
            graphqlHTTP((req) => {
                const cookies = nextCookie({ req })
                const context = {
                    [this.condoAccessTokenKey]: get(req, ['session', this.condoAccessTokenKey]),
                    [this.appTokenKey]: get(req, ['session', this.appTokenKey]),
                    [ACCEPT_LANGUAGE_KEY]: get(req,  ['headers', ACCEPT_LANGUAGE_KEY]),
                    [COOKIES_KEY]: {
                        locale: get(cookies, 'locale'),
                        NEXT_LOCALE: get(cookies, 'NEXT_LOCALE'),
                    },
                }
                return {
                    schema,
                    context,
                    graphiql: false,
                    uploads: false,
                    validationRules: [NoIntrospectionRule],
                }
            })
        )

        return app
    }
}

module.exports = { StitchSchemaMiddleware, makeRemoteExecutor }
