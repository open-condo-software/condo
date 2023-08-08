const opentelemetry = require('@opentelemetry/api')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
const opentelemetrySDK = require('@opentelemetry/sdk-node')
const express = require('express')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

class TracingMiddleware {
    tracer

    constructor () {
        const sdk = new opentelemetrySDK.NodeSDK({
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
            instrumentations: [getNodeAutoInstrumentations()],
        })
        sdk.start()

        this.tracer = opentelemetry.trace.getTracer(
            'keystone',
            '1.0.0',
        )
    }

    async prepareMiddleware ({ keystone }) {
        const app = express()
        const tracer = this.tracer

        app.use((req, res, next) => {
            tracer.startActiveSpan('testManualSpan', (parentSpan) => {
                res.on('close', () => {
                    parentSpan.end()
                })
            })
            next()
        })

        return app
    }
}

module.exports = {
    TracingMiddleware,
}