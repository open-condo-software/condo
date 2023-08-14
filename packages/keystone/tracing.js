const opentelemetry = require('@opentelemetry/api')
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg')
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
const opentelemetrySDK = require('@opentelemetry/sdk-node')

const KeystoneInstrumentation = require('./KeystoneInstrumentation')

const init = ({ tracesUrl = 'http://localhost:4318/v1/traces', metricsUrl = 'http://localhost:4318/v1/metrics' } = {}) => {
    const sdk = new opentelemetrySDK.NodeSDK({
        serviceName: 'condo',
        traceExporter: new OTLPTraceExporter({
            url: tracesUrl,
            headers: {},
        }),
        metricReader: new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
                url: metricsUrl,
                headers: {},
                concurrencyLimit: 1,
            }),
        }),

        instrumentations: [
            new PgInstrumentation(),
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
        const keystoneTracer = getTracer('@open-condo/keystone')
        KeystoneInstrumentation.patchKeystone(keystoneTracer, keystone)
    }
}

module.exports = {
    TracingMiddleware,
    init,
    getTracer,
}