const os = require('os')

const otelApi = require('@opentelemetry/api')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { IORedisInstrumentation } = require('@opentelemetry/instrumentation-ioredis')
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg')
const otelSdk = require('@opentelemetry/sdk-node')
const express = require('express')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getListAdapters } = require('@open-condo/keystone/databaseAdapters/utils')

const { getExecutionContext } = require('./executionContext')


const HOSTNAME = os.hostname()
const DELIMETER = ':'
const SERVER_URL = conf.SERVER_URL
const KEYSTONE_MUTATION_QUERY_REGEX = /(?:mutation|query)\s+(\w+)/

const IS_OTEL_TRACING_ENABLED = conf.IS_OTEL_TRACING_ENABLED === '1'
const OTEL_CONFIG = conf.OTEL_CONFIG ? JSON.parse(conf.OTEL_CONFIG) : {}

const { tracesUrl, headers = {} } = OTEL_CONFIG

const tracers = {}

if (IS_OTEL_TRACING_ENABLED) {

    const sdk = new otelSdk.NodeSDK({
        serviceName: `condo${DELIMETER}${SERVER_URL.replace(/^(https?:\/\/)/, '')}`,

        traceExporter: new OTLPTraceExporter({
            url: tracesUrl,
            headers: headers,
        }),

        instrumentations: [
            new PgInstrumentation(),
            new IORedisInstrumentation(),
        ],
    })

    sdk.start()
}

const _getTracer = (name) => {
    if (!tracers[name]) {
        tracers[name] = otelApi.trace.getTracer(
            name,
            '1.0.0',
        )
    }
    return tracers[name]
}

function _getTracedFunction ({ name, spanHook, tracer, ctx, f }) {
    return async function (...args) {
        // Sometimes you want the name of the trace to be calculated in runtime
        const parsedName = typeof name === 'function' ? name(...args) : name

        return tracer.startActiveSpan(parsedName, async (span) => {

            _addExecutionContextAttributes(span)

            spanHook(span, ...args)

            const res = await f.call(ctx, ...args)
            span.end()
            return res
        })
    }
}

function _addExecutionContextAttributes (span) {
    const executionContext = getExecutionContext()
    span.setAttribute('hostname', HOSTNAME)

    if (executionContext.startReqId) {
        span.setAttribute('startReqId', executionContext.startReqId)
    }

    if (executionContext.reqId) {
        span.setAttribute('reqId', executionContext.reqId)
    }

    if (executionContext.execId) {
        span.setAttribute('execId', executionContext.execId)
        span.setAttribute('execProcessArgv', executionContext.execProcessArgv)
    }

    if (executionContext.taskId) {
        span.setAttribute('taskId', executionContext.taskId)
        span.setAttribute('taskName', executionContext.taskName)
    }
}

/**
 * Monkey patch keystone with open telemetry tracing
 */
class KeystoneTracingApp {

    tracer = _getTracer('@open-condo/tracing/keystone-tracing-app')

    _getTracedAdapterFunction (tracer, config, ctx, f) {
        const { name, listKey } = config

        return _getTracedFunction({
            name: name + DELIMETER + listKey,
            spanHook: (span, _) => {
                span.setAttribute('type', 'adapter')
                span.setAttribute('listKey', listKey)
                span.setAttribute('functionName', name)
            },
            ctx, f, tracer,
        })
    }

    _patchKeystoneAdapter (tracer, keystone) {
        for (const listAdapter of Object.values(getListAdapters(keystone))) {
            const originalListAdapter = listAdapter
            const listKey = listAdapter.key

            listAdapter.find = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:find' }, listAdapter, originalListAdapter.find)
            listAdapter.findOne = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:findOne' }, listAdapter, originalListAdapter.findOne)
            listAdapter.findById = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:findById' }, listAdapter, originalListAdapter.findById)
            listAdapter.itemsQuery = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:itemsQuery' }, listAdapter, originalListAdapter.itemsQuery)

            listAdapter.create = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:create' }, listAdapter, originalListAdapter.create)
            listAdapter.delete = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:delete' }, listAdapter, originalListAdapter.delete)
            listAdapter.update = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:update' }, listAdapter, originalListAdapter.update)

            listAdapter.createMany = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.createMany)
            listAdapter.deleteMany = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.deleteMany)
            listAdapter.updateMany = this._getTracedAdapterFunction(tracer, { listKey, name: 'adapter:createMany' }, listAdapter, originalListAdapter.updateMany)
        }
    }

    _patchKeystoneGraphQLExecutor (tracer, keystone) {
        const originalExecuteGraphQL = keystone.executeGraphQL
        keystone.executeGraphQL = ({ context, query, variables }) => {
            let queryName = undefined
            if (typeof query === 'string') {
                const matches = query.match(KEYSTONE_MUTATION_QUERY_REGEX)
                if (matches && matches[1])
                    queryName = matches[1]
            } else {
                queryName = get(query, ['definitions', 0, 'name', 'value'])
            }

            return tracer.startActiveSpan('gql' + DELIMETER + queryName, async (span) => {
                span.setAttribute('queryName', queryName)

                const result = originalExecuteGraphQL.call(keystone, { context, query, variables })
                span.end()
                return result
            })
        }
    }

    async prepareMiddleware ({ keystone }) {
        if (!IS_OTEL_TRACING_ENABLED) return

        const tracer = this.tracer
        this._patchKeystoneGraphQLExecutor(tracer, keystone)
        this._patchKeystoneAdapter(tracer, keystone)

        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use((req, res, next) => {

            const requestUrl = get(req, ['url'])
            const requestUserId = get(req, ['user', 'id'])
            const requestOpName = get(req, ['body', 'operationName']) || get(req, ['query', 'operationName'])

            let operationName = 'op:unknown'
            if (requestOpName) {
                operationName = 'op:' + requestOpName
            }

            tracer.startActiveSpan(operationName, async (span) => {

                _addExecutionContextAttributes(span)

                span.setAttribute('url', requestUrl)
                span.setAttribute('userId', requestUserId)
                span.setAttribute('opName', requestOpName)

                res.on('close', () => {
                    span.end()
                })
                next()
            })
        })
        return app
    }
}

module.exports = {
    KeystoneTracingApp,
}
