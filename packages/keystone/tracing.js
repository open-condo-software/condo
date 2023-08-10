const opentelemetry = require('@opentelemetry/api')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
const { GraphQLInstrumentation } = require('@opentelemetry/instrumentation-graphql')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { KnexInstrumentation, KnexInstrumentationConfig } = require('@opentelemetry/instrumentation-knex')
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
const opentelemetrySDK = require('@opentelemetry/sdk-node')
const express = require('express')
const { get, set } = require('lodash')

const init = () => {
    const sdk = new opentelemetrySDK.NodeSDK({
        serviceName: 'condo',
        traceExporter: new OTLPTraceExporter({
            // optional - default url is http://localhost:4318/v1/traces
            //url: 'http://0.0.0.0:4317',
            // optional - collection of custom headers to be sent with each request, empty by default
            headers: {},
        }),
        metricReader: new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
                //url: '<your-otlp-endpoint>/v1/metrics', // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
                //url: 'http://0.0.0.0:4317',
                headers: {}, // an optional object containing custom headers to be sent with each request
                concurrencyLimit: 1, // an optional limit on pending requests
            }),
        }),

        instrumentations: [
            //getNodeAutoInstrumentations(),
            //new HttpInstrumentation(),
            //new ExpressInstrumentation(),
            //new GraphQLInstrumentation(),
            new KnexInstrumentation({ maxQueryLength: 100 }),
        ],
    })

    sdk.start()
}

const tracers = {}
const getTracer = (name) => {
    if (!tracers[name]) {
        tracers[name] = opentelemetry.trace.getTracer(
            name,
            '1.0.0',
        )
    }
    return tracers[name]
}

function getTracedQueryFunction (tracer, config, ctx, f) {
    const { name, listKey } = config

    return async function (args, context, gqlName, info, from) {
        return tracer.startActiveSpan(name + '_' + listKey, async (span) => {
            span.setAttribute('type', 'query')

            span.setAttribute('listKey', listKey)
            span.setAttribute('functionName', name)

            span.setAttribute('gqlName', gqlName)
            span.setAttribute('args', args)

            const listResult = await f.call(ctx, args, context, gqlName, info, from)
            span.end()
            return listResult
        })
    }
}


function getTracedMutationFunction (tracer, config, ctx, f) {
    const { name, listKey } = config

    return async function (data, context, mutationState) {
        return tracer.startActiveSpan(name + '_' + listKey, async (span) => {
            span.setAttribute('type', 'mutation')

            span.setAttribute('listKey', listKey)
            span.setAttribute('functionName', name)

            const result = await f.call(ctx, data, context, mutationState)
            span.end()
            return result
        })
    }
}


const addInstrumentationToKeystone = (tracer, keystone) => {
    // Patch keystone executeGraphQL
    const originalExecuteGraphQL = keystone.executeGraphQL

    const ksTracer = getTracer('keystone')

    keystone.executeGraphQL = ({ context, query, variables }) => {

        const queryDefenition = query.definitions
        const queryName = get(queryDefenition, [0, 'name', 'value'])

        return ksTracer.startActiveSpan('gql' + '_' + queryName, async (span) => {
            span.setAttribute('queryName', queryName)

            const result = originalExecuteGraphQL.call(keystone, { context, query, variables })
            span.end()
            return result
        })

    }

    const ksListTracer = getTracer('keystone-list')

    // Patch keystone lists
    keystone.listsArray.map((list) => {
        const patchedList = list

        const listKey = list.key

        patchedList.createMutation = getTracedMutationFunction(ksListTracer, { listKey, name: 'createMutation' }, list, list.createMutation)
        patchedList.createManyMutation = getTracedMutationFunction(ksListTracer, { listKey, name: 'createManyMutation' }, list, list.createManyMutation)

        patchedList.updateMutation = getTracedMutationFunction(ksListTracer, { listKey, name: 'updateMutation' }, list, list.updateMutation)
        patchedList.updateManyMutation = getTracedMutationFunction(ksListTracer, { listKey, name: 'updateManyMutation' }, list, list.updateManyMutation)

        // patchedList.deleteMutation = getMutationFunctionWithCache(list, list.deleteMutation, true, requestCache)
        // patchedList.deleteManyMutation = getMutationFunctionWithCache(list, list.deleteManyMutation, true, requestCache)

        patchedList.listQuery = getTracedQueryFunction(ksListTracer, { listKey, name: 'listQuery' }, list, list.listQuery)
        patchedList.itemQuery = getTracedQueryFunction(ksListTracer, { listKey, name: 'itemQuery' }, list, list.itemQuery)

        return patchedList
    })
}


class TracingMiddleware {
    async prepareMiddleware ({ keystone }) {

        const keystoneTracer = getTracer('keystone')
        addInstrumentationToKeystone(keystoneTracer, keystone)
    }
}

module.exports = {
    TracingMiddleware,
    init,
    getTracer,
}