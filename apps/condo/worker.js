const { getHeapStatistics } = require('node:v8')

// eslint-disable-next-line
const conf = require('@open-condo/config')  // Note: we need to prepare process.env first
// eslint-disable-next-line
const tracer = require('dd-trace')  // Note: required for monkey patching

const { getLogger } = require('@open-condo/keystone/logging')
const { createWorker } = require('@open-condo/keystone/tasks')
const { getAppName, getXRemoteApp, getXRemoteClient, getXRemoteVersion } = require('@open-condo/keystone/tracingUtils')

const index = require('./index')

const logger = getLogger('worker-memory')

const MiB = 1024 ** 2 // 1 MiB (mebibyte) = 1_048_576 B (byte)
const MEMORY_LOG_INTERVAL = 10 * 60 * 1000 // 10 minutes

// Note: Hard limit of the V8 heap (bytes). Fixed for the lifetime of the process.
//  Can be raised with the CLI flag `node --max-old-space-size=<MiB>` or via `NODE_OPTIONS="--max-old-space-size=<MiB>"` env
const { heap_size_limit: heapSizeLimitBytes } = getHeapStatistics()

/**
 * Calculates free V8 heap memory in both absolute and percentage terms
 * @return {{ freeMiB: number, freePct: number }} Free heap in MiB and percentage (0-100%)
 */
function getHeapFree () {
    const { heapUsed } = process.memoryUsage()
    const freeBytes = Math.max(0, heapSizeLimitBytes - heapUsed)
    const freePct = Number((freeBytes / heapSizeLimitBytes * 100).toFixed(1)) // Percentage of V8 heap available (0-100%)
    const freeMiB = Number((freeBytes / MiB).toFixed(2)) // Absolute free V8 heap in MiB
    return { freeMiB, freePct } // Both metrics useful: freePct for alerts (e.g., <10% triggers OOM risk), freeMiB for capacity planning
}

/**
 * Logs current memory usage statistics
 * @param {string} [msg='memory stats'] - Message for the log entry
 */
function logMemoryStats (msg = 'memory stats') {
    const mem = process.memoryUsage()
    const nativeMemory = mem.rss - mem.heapTotal

    logger.info({
        msg,
        mem: getHeapFree(), // V8 heap free memory (same format as GraphQL logger) - { freeMiB, freePct }
        data: {
            rss: Number((mem.rss / MiB).toFixed(2)), // Resident Set Size - total memory in RAM (MiB)
            heapTotal: Number((mem.heapTotal / MiB).toFixed(2)), // Total V8 heap allocated (MiB)
            heapUsed: Number((mem.heapUsed / MiB).toFixed(2)), // V8 heap actually used (MiB)
            external: Number((mem.external / MiB).toFixed(2)), // C++ objects bound to JavaScript (MiB)
            arrayBuffers: Number((mem.arrayBuffers / 1024).toFixed(2)), // ArrayBuffer and SharedArrayBuffer memory (KiB)
            nativeMemory: Number((nativeMemory / MiB).toFixed(2)), // Native memory (RSS - heapTotal) (MiB)
        },
    })
}

/**
 * Starts periodic memory monitoring
 * Logs memory stats immediately on startup and then every MEMORY_LOG_INTERVAL
 */
function startMemoryMonitoring () {
    // Log immediately on startup
    logMemoryStats('memory stats (startup)')

    // Log periodically
    setInterval(() => logMemoryStats(), MEMORY_LOG_INTERVAL)
}

const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production' && conf.DD_TRACE_ENABLED === 'true'

if (IS_ENABLE_DD_TRACE) {
    const isDDLog = conf.DD_TRACE_LOGGING === 'true'
    const appName = getAppName()
    const xRemoteApp = getXRemoteApp()
    const xRemoteClient = getXRemoteClient()
    const xRemoteVersion = getXRemoteVersion()
    // NOTE: https://datadoghq.dev/dd-trace-js/
    tracer.init({
        // Note: we need to save old service name as `root` to save history
        service: (appName === 'condo-app') ? 'root' : appName,
        tags: { xRemoteApp, xRemoteClient, xRemoteVersion },
        experimental: (isDDLog) ? { exporter: 'log' } : undefined,
        // NOTE: we don't need IAST and AppSec inside workers
        // TODO(pahaz): DOMA-10202 probably we need to set it by ENV but at the moment I can't change env for workers only
        iast: { enabled: false },
        appsec: { enabled: false },
    })
}

function traceWrapper (fn) {
    return tracer.wrap('task.process', fn)
}

createWorker(index, process.argv.slice(2), traceWrapper)
    .then(() => {
        // Start memory monitoring after worker is initialized
        startMemoryMonitoring()
    })
    .catch((error) => {
        console.error(error)
        process.exit(2)
    })
