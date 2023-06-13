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
const os = require('os')

const StatsD = require('hot-shots')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const logger = getLogger('metrics')

const STATSD_METRIC_PREFIX = conf['STATSD_METRIC_PREFIX'] || 'condo.'
const STATSD_PORT = conf['STATSD_PORT'] || 8125
const HOSTNAME = os.hostname()

/**
 * Name should contain only alphanumeric characters (A-z, 0-9) and dot delimiter
 * Best practice to use this template:
 *
 * <domain>.<file>.<metric-name>
 *
 * Examples:
 * - billing.registerBillingReceipts.totalCreatedReceipts
 * - billing.allResidentBillingReceipts.executionTime
 * - adapterCache.hitrate
 * - adapterCache.size
 *
 * @param name
 */
const validateName = (name) => {
    if (!nameChecker.test(name)) { throw new Error(`You metric ${name} is badly named! PLease check metric.js module for explanations`) }
}

const nameChecker = new RegExp('^[a-zA-Z0-9]+(\\.[a-zA-Z0-9]+)*\\.?$')
if (!nameChecker.test(STATSD_METRIC_PREFIX)) { throw new Error(`You prefix ${STATSD_METRIC_PREFIX} is badly named! PLease check metric.js module for explanations`) }

const StatsDClient = new StatsD({
    port: STATSD_PORT,
    prefix: STATSD_METRIC_PREFIX,
    errorHandler: (err) => logger.error({ 'msg':'Something went wrong when sending metrics:', 'err': err }),
    globalTags: { hostname: HOSTNAME, command: process.argv[1] },
})

const gauge = ({ name, value }) => {
    validateName(name)
    StatsDClient.gauge(name, value)
}

const histogram = ({ name, value }) => {
    validateName(name)
    StatsDClient.histogram(name, value)
}

const count = ({ name, value }) => {
    validateName(name)
    StatsDClient.count(name, value)
}

setInterval(() => {gauge({ name:'custom.metrics.running', value: 1 })}, 1000)

module.exports = {
    gauge,
    count,
    histogram,
}