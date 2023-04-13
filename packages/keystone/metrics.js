/**
 * This module allows user to send custom metrics to any system, that supports statsd (Datadog, Grafana, Etc)
 *
 * To use this module you need to add two environment variables:
 * STATSD_PORT: Port used by statsd daemon in your system
 * STATSD_METRIC_PREFIX: Metric prefix
 *
 * After these environment variables are set, you can use supplied functions.
 * To learn more about differences between gauge, histogram and count type metrics, please refer to the datadog documentation
 * https://docs.datadoghq.com/metrics/custom_metrics/dogstatsd_metrics_submission/
 */
const StatsD = require('hot-shots')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const logger = getLogger('metrics')

const STATSD_METRIC_PREFIX = conf['STATSD_METRIC_PREFIX'] || 'condo.'
const STATSD_PORT = conf['STATSD_PORT'] || 8125

const StatsDClient = new StatsD({
    port: STATSD_PORT,
    prefix: STATSD_METRIC_PREFIX,
    errorHandler: (err) => logger.error({ 'msg':'Something went wrong when sending metrics:', 'err': err }),
})

const gauge = ({ name, value }) => {
    StatsDClient.gauge(name, value)
    logger.warn(`METRIC IS SENT, ${name}`)
}

const histogram = ({ name, value }) => {
    StatsDClient.histogram(name, value)
}

const count = ({ name, value }) => {
    StatsDClient.count(name, value)
}

module.exports = {
    gauge,
    count,
    histogram,
}