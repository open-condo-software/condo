const process = require('node:process')
const { PerformanceObserver } = require('perf_hooks')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('memMon')

function isMemMonEnabled () {
    return !process.env['DISABLE_MEM_MON']
}

function catchGC () {
    const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const mem = process.memoryUsage()

        logger.info({ msg: 'afterGC', data: { mem, entriesCount: entries.length, entries } })
    })

    obs.observe({ entryTypes: ['gc'], buffered: true })
}

module.exports = { isMemMonEnabled, catchGC, logger }
