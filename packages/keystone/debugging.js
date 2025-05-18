const crypto = require('crypto')
const fs = require('fs')
const { Session } = require('inspector')
const os = require('os')
const path = require('path')
const {
    monitorEventLoopDelay,
    performance,
    PerformanceObserver,
} = require('perf_hooks')
const { promisify } = require('util')
const v8 = require('v8')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const SAMPLE_MS = 20 // sample period
const HISTORY = 10 // how many samples
const TOKEN = conf['RUNTIME_STATS_ACCESS_TOKEN']

const HOSTNAME = os.hostname()
const CPU_CORES = os.cpus().length

// keeps a rolling HDR-histogram of event-loop latency (how long the loop is blocked); docs: https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions
const LOOP_MONITOR = monitorEventLoopDelay({ resolution: 10 })

const ENDPOINT_LOCKS = new Map()

const logger = getLogger('debugging')

// NOTE(pahaz): process.cpuUsage() deprecated → process.resourceUsage() since Node ≥ 20
let prevCpu = process.cpuUsage()
let prevNS = process.hrtime.bigint()
let prevELU = performance.eventLoopUtilization()

let totalGcCount = 0, totalGcMS = 0, totalGcKinds = {}

// hooks into the PerformanceEntry stream (e.g. 'gc', 'mark', 'measure') so you can react to runtime events; docs: https://nodejs.org/api/perf_hooks.html#class-performanceobserver
new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
        totalGcCount += 1
        totalGcMS += e.duration
        totalGcKinds[e.kind] = (totalGcKinds[e.kind] ?? 0) + 1
    }
})
    .observe({ entryTypes: ['gc'] })

const METRICS_MEMORY = []

function pushMetricToMemory (sample) {
    METRICS_MEMORY.push(sample)
    if (METRICS_MEMORY.length > HISTORY) METRICS_MEMORY.shift()
}

function collect () {
    /* CPU — diff */
    const cpuDiff = process.cpuUsage(prevCpu) // microseconds
    const nowNS = process.hrtime.bigint()
    const diffMS = Number(nowNS - prevNS) / 1e6
    const cpuPct = (diffMS >= 1) ? +(((cpuDiff.user + cpuDiff.system) / 1000) / (diffMS * CPU_CORES) * 100).toFixed(2) : -1

    prevCpu = process.cpuUsage()
    prevNS = nowNS

    /* MEMORY */
    const usages = process.memoryUsage()
    const heap = v8.getHeapStatistics()
    const spaces = v8.getHeapSpaceStatistics()

    /* ELU */
    const elu = performance.eventLoopUtilization(prevELU)
    prevELU = performance.eventLoopUtilization()

    /* ELU delays per interval */
    const d = {
        mean: LOOP_MONITOR.mean / 1e6,
        min: LOOP_MONITOR.min / 1e6,
        max: LOOP_MONITOR.max / 1e6,
        p50: LOOP_MONITOR.percentile(50) / 1e6,
        p95: LOOP_MONITOR.percentile(95) / 1e6,
        p99: LOOP_MONITOR.percentile(99) / 1e6,
    }
    LOOP_MONITOR.reset()

    /* GC */
    const gc = {
        count: totalGcCount,
        pauseMS: +totalGcMS.toFixed(1),
        kindsTotal: { ...totalGcKinds },
    }

    /* Queue (libuv) */
    const handles = process._getActiveHandles ? process._getActiveHandles().length : undefined
    const requests = (process._getActiveRequests) ? process._getActiveRequests().length : undefined

    pushMetricToMemory({
        date: Date.now(),
        cpu: {
            cores: CPU_CORES,
            pct: cpuPct,
            load: os.loadavg(),
            diffs: cpuDiff,
        },
        memory: {
            osTotal: os.totalmem(),
            osFree: os.freemem(),
            heap: heap,
            heapSpaces: spaces,
            usage: usages,
        },
        eventLoop: {
            utilization: +elu.utilization.toFixed(3),
            idle: +(elu.idle / 1e3).toFixed(0),
            active: +(elu.active / 1e3).toFixed(0),
            delay: d,
        },
        eventQueue: { handles, requests },
        gc,
    })
}

async function writeCpuProfileSnapshot (ms = 10_000) {
    const session = new Session()
    session.connect()
    const post = promisify(session.post).bind(session)
    try {
        await post('Profiler.enable')
        await post('Profiler.start')

        await new Promise(resolve => setTimeout(resolve, ms))

        const { profile } = await post('Profiler.stop')

        const tmpFile = path.join(os.tmpdir(), `cpu-${Date.now()}.cpuprofile`)
        await fs.promises.writeFile(tmpFile, JSON.stringify(profile))
        return tmpFile
    } finally {
        session.disconnect()
    }
}

function hasValidToken (req, res) {
    const requestToken = req.query?.['token']
    const ok = requestToken && TOKEN && crypto.timingSafeEqual(
        Buffer.from(requestToken),
        Buffer.from(TOKEN),
    )
    if (!ok) res.sendStatus(403)
    return ok
}

function hasEnoughHeap (req, res, minFreeRatio = 0.50) {  // ≥ 50 % default limit
    const { heap_size_limit } = v8.getHeapStatistics()  // bytes
    const { heapUsed } = process.memoryUsage()
    const free = Math.max(0, heap_size_limit - heapUsed)
    const freeRatio = free / heap_size_limit
    const ok = freeRatio >= minFreeRatio
    if (!ok) res.status(503).json({
        ok: false,
        error: 'Not enough V8 heap space',
        heapLimit: heap_size_limit,
        heapUsed: heapUsed,
        heapFreePct: +(freeRatio * 100).toFixed(1),
    })
    return ok
}

function acquireLock (req, res, key = 'default') {
    const ok = !ENDPOINT_LOCKS.has(key)
    if (ok) {
        ENDPOINT_LOCKS.set(key, true)
    } else {
        res.status(429).json({
            ok: false,
            error: 'Previous request is still in progress',
        })
    }
    return ok
}

function releaseLock (key = 'default') { ENDPOINT_LOCKS.delete(key) }

function addDebugTools (app) {

    LOOP_MONITOR.enable()
    setInterval(collect, SAMPLE_MS).unref()

    // TODO(pahaz): think about standards for `diagnostics_channel` to collect some business events timing

    app.get('/api/debug/heap', (req, res) => {
        if (!hasValidToken(req, res)) return
        if (!hasEnoughHeap(req, res)) return
        if (!acquireLock(req, res)) return
        try {
            const filePath = v8.writeHeapSnapshot()  // "…/heap-<pid>-<ts>.heapsnapshot"
            const downloadName = `heap-${HOSTNAME}-${Date.now()}.heapsnapshot`

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`)

            res.sendFile(filePath, err => {
                if (err) logger.error({ msg: 'DownloadError', err })
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                fs.unlink(filePath, () => {})
            })
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message })
        } finally {
            releaseLock()
        }
    })

    app.get('/api/debug/cpu', async (req, res) => {
        if (!hasValidToken(req, res)) return
        if (!hasEnoughHeap(req, res)) return
        if (!acquireLock(req, res)) return
        try {
            const filePath = await writeCpuProfileSnapshot(10_000)  // "…/cpu-<now>.cpuprofile"
            const downloadName = `cpu-${HOSTNAME}-${Date.now()}.cpuprofile`

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`)

            res.sendFile(filePath, err => {
                if (err) logger.error({ msg: 'DownloadError', err })
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                fs.unlink(filePath, () => {})
            })
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message })
        } finally {
            releaseLock()
        }
    })

    app.get('/api/debug/metrics', async (req, res) => {
        if (!hasValidToken(req, res)) return
        const metrics = (METRICS_MEMORY.length > 0) ? METRICS_MEMORY[METRICS_MEMORY.length - 1] : undefined
        res.json({ ok: true, host: HOSTNAME, metrics })
    })
}

module.exports = { addDebugTools }
