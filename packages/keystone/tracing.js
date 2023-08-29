const otelApi = require('@opentelemetry/api')
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg')
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
const otelSdk = require('@opentelemetry/sdk-node')
const { get } = require('lodash')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const DELIMETER = ':'
const KEYSTONE_MUTATION_QUERY_REGEX = /(?:mutation|query)\s+(\w+)/

const IS_OTEL_TRACING_ENABLED = conf.IS_OTEL_TRACING_ENABLED === '1'
const OTEL_CONFIG = conf.OTEL_CONFIG ? JSON.parse(conf.OTEL_CONFIG) : {}

const { tracesUrl, metricsUrl, headers = {} } = OTEL_CONFIG
const logger = getLogger('open-telemetry')

const tracers = {}

const _getTracer = (name) => {
    if (!tracers[name]) {
        tracers[name] = otelApi.trace.getTracer(
            name,
            '1.0.0',
        )
    }
    return tracers[name]
}

const sdk = new otelSdk.NodeSDK({
    serviceName: 'condo',
    traceExporter: new OTLPTraceExporter({
        url: tracesUrl,
        headers: headers,
    }),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
            url: metricsUrl,
            headers: headers,
            concurrencyLimit: 1,
        }),
    }),

    instrumentations: [
        new HttpInstrumentation(),
        new PgInstrumentation(),
    ],
})

sdk.start()

function _getTracedFunction ({ name, spanHook, tracer, ctx, f }) {
    return async function (...args) {
        // Sometimes you want the name of the trace to be calculated in runtime
        const parsedName = typeof name === 'function' ? name(...args) : name

        return tracer.startActiveSpan(parsedName, async (span) => {
            spanHook(span, ...args)

            const res = await f.call(ctx, ...args)
            span.end()
            return res
        })
    }
}

/**
 * Monkey patch keystone with open telemetry tracing
 */
class KeystoneTracingApp {

    tracer = _getTracer('@open-condo/tracing/keystone-tracing-app')

    _getTracedQueryFunction (tracer, config, ctx, f) {
        const { name, listKey } = config
        return _getTracedFunction({
            name: name + DELIMETER + listKey,
            spanHook: (span, _) => {
                span.setAttribute('type', 'query')
                span.setAttribute('listKey', listKey)
                span.setAttribute('functionName', name)
            },
            ctx, f, tracer,
        })
    }

    _getTracedMutationFunction (tracer, config, ctx, f) {
        const { name, listKey } = config
        return _getTracedFunction({
            name: name + DELIMETER + listKey,
            spanHook: (span, _) => {
                span.setAttribute('type', 'mutation')
                span.setAttribute('listKey', listKey)
            },
            ctx, f, tracer,
        })
    }

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

    _patchKeystoneList (tracer, keystone) {
        keystone.listsArray.map((list) => {
            const patchedList = list

            const listKey = list.key

            patchedList.createMutation = this._getTracedMutationFunction(tracer, { listKey, name: 'createMutation' }, list, list.createMutation)
            patchedList.createManyMutation = this._getTracedMutationFunction(tracer, { listKey, name: 'createManyMutation' }, list, list.createManyMutation)

            patchedList.updateMutation = this._getTracedMutationFunction(tracer, { listKey, name: 'updateMutation' }, list, list.updateMutation)
            patchedList.updateManyMutation = this._getTracedMutationFunction(tracer, { listKey, name: 'updateManyMutation' }, list, list.updateManyMutation)

            patchedList.deleteMutation = this._getTracedMutationFunction(tracer, { listKey, name: 'deleteMutation' }, list, list.deleteMutation)
            patchedList.deleteManyMutation = this._getTracedMutationFunction(tracer, { listKey, name: 'deleteManyMutation' }, list, list.deleteManyMutation)

            patchedList.listQuery = this._getTracedQueryFunction(tracer, { listKey, name: 'listQuery' }, list, list.listQuery)
            patchedList.itemQuery = this._getTracedQueryFunction(tracer, { listKey, name: 'itemQuery' }, list, list.itemQuery)

            return patchedList
        })
    }

    _patchKeystoneAdapter (tracer, keystone) {
        for (const listAdapter of Object.values(get(keystone, ['adapter', 'listAdapters']))) {
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
        this._patchKeystoneList(tracer, keystone)
        this._patchKeystoneAdapter(tracer, keystone)
    }
}


module.exports = {
    KeystoneTracingApp,
    ApolloTracingPlugin,
}