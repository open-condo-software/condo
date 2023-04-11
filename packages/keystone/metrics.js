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