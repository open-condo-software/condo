const StatsD = require('hot-shots')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const logger = getLogger('metricReporter')

const METRIC_TYPE_COUNT = 'count.'
const METRIC_TYPE_GAUGE = 'gauge'
const METRIC_TYPE_HISTOGRAM = 'histogram'

const STATSD_METRIC_PREFIX = conf['STATSD_METRIC_PREFIX'] || 'condo.'
const STATSD_PORT = conf['STATSD_PORT'] || 8125

const StatsDClient = new StatsD({
    port: STATSD_PORT,
    prefix: STATSD_METRIC_PREFIX,
    errorHandler: (err) => logger.error({ 'msg':'Something went wrong when sending metrics:', 'err': err }),
})

/**
 * Send a metric to statsd server (Datadog / Grafana)
 * @param name
 * @param value
 * @param timestamp
 * @param type
 */
const reportMetric = ({ name, value, type }) => {
    if (type === METRIC_TYPE_GAUGE) {
        StatsDClient.gauge(name, value)
    }

    if (type === METRIC_TYPE_COUNT) {
        StatsDClient.count(name, value)
    }

    if (type === METRIC_TYPE_HISTOGRAM) {
        StatsDClient.histogram(name, value)
    }

    logger.error({ 'msg': 'You tried to submit metric with unsupported type. Please check reportMetric function for details' })
}


module.exports = {
    reportMetric,
    METRIC_TYPE_COUNT,
    METRIC_TYPE_GAUGE,
    METRIC_TYPE_HISTOGRAM,
}