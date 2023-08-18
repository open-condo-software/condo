const otelApi = require('@opentelemetry/api')
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg')
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics')
const otelSdk = require('@opentelemetry/sdk-node')

const KeystoneInstrumentation = require('./KeystoneInstrumentation')
const { getLogger } = require('./logging')

const logger = getLogger('open-telemetry')

const tracers = {}
const getTracer = (name) => {
    if (!tracers[name]) {
        tracers[name] = otelApi.trace.getTracer(
            name,
            '1.0.0',
        )
    }
    return tracers[name]
}


class TracingMiddleware {
    enabled = false

    constructor ({ enabled, tracesUrl, metricsUrl, headers = {} }) {
        this.enabled = !!enabled

        if (!this.enabled) {
            return
        }

        logger.info({ message: 'OTEL is enabled. Config:', tracesUrl, metricsUrl })

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
    }

    async prepareMiddleware ({ keystone }) {
        if (!this.enabled) {
            return
        }

        const keystoneTracer = getTracer('@open-condo/keystone')
        KeystoneInstrumentation.patchKeystone(keystoneTracer, keystone)
    }
}

module.exports = {
    TracingMiddleware,
    getTracer,
}