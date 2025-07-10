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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    errorHandler: () => {},
    globalTags: { hostname: HOSTNAME, command: process.argv[1] },
})

const gauge = ({ name, value, tags }) => {
    validateName(name)
    StatsDClient.gauge(name, value, tags)
}

const histogram = ({ name, value, tags }) => {
    validateName(name)
    StatsDClient.histogram(name, value, tags)
}

const increment = ({ name, value, tags }) => {
    validateName(name)
    StatsDClient.increment(name, value, tags)
}

const decrement = ({ name, value, tags }) => {
    validateName(name)
    StatsDClient.decrement(name, value, tags)
}

module.exports = {
    gauge,
    increment,
    decrement,
    histogram,
}