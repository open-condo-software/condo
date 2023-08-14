const opentelemetry = require('@opentelemetry/api')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
const { GraphQLInstrumentation } = require('@opentelemetry/instrumentation-graphql')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const {
    IORedisInstrumentation,
} = require('@opentelemetry/instrumentation-ioredis')
const { KnexInstrumentation, KnexInstrumentationConfig } = require('@opentelemetry/instrumentation-knex')
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg')
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
const opentelemetrySDK = require('@opentelemetry/sdk-node')
const express = require('express')
const { get, set } = require('lodash')

const KeystoneInstumentation = require('./KeystoneInstrumentation')

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
            new PgInstrumentation(),
            new IORedisInstrumentation(),
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


class TracingMiddleware {
    async prepareMiddleware ({ keystone }) {
        const keystoneTracer = getTracer('keystone')
        KeystoneInstumentation.patchKeystone(keystoneTracer, keystone)
    }
}

module.exports = {
    TracingMiddleware,
    init,
    getTracer,
}