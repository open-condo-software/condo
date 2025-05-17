const { Session } = require('inspector')
const os = require('os')
const {
    monitorEventLoopDelay,
    performance,
    PerformanceObserver,
} = require('perf_hooks')
const { promisify } = require('util')
const v8 = require('v8')

const conf = require('@open-condo/config')

const SAMPLE_MS = 20 // sample period
const HISTORY = 10 // how many samples
const TOKEN = conf['RUNTIME_STATS_ACCESS_TOKEN']

const HOSTNAME = os.hostname()
const CPU_CORES = os.cpus().length

// keeps a rolling HDR-histogram of event-loop latency (how long the loop is blocked); docs: https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions
const LOOP_MONITOR = monitorEventLoopDelay({ resolution: 10 })

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
    const cpuPct = ((cpuDiff.user + cpuDiff.system) / 1000) / (diffMS * CPU_CORES) * 100

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
            pct: +cpuPct.toFixed(2),
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
        memoryHeap: v8.getHeapStatistics(),
        eventLoop: {
            utilization: +elu.utilization.toFixed(3),
            idle: (elu.idle / 1e3).toFixed(0),
            active: (elu.active / 1e3).toFixed(0),
            delay: d,
        },
        eventQueue: { handles, requests },
        gc,
    })
}

async function captureCpu (ms = 10_000) {
    const session = new Session()
    const post = promisify(session.post).bind(session)
    try {
        await post('Profiler.enable')
        await post('Profiler.start')

        await new Promise(resolve => setTimeout(resolve, ms))

        const { profile } = await post('Profiler.stop')
        return JSON.stringify(profile)
    } finally {
        session.disconnect()
    }
}

function addDebugTools (app) {

    LOOP_MONITOR.enable()
    setInterval(collect, SAMPLE_MS).unref()

    // TODO(pahaz): think about standards for `diagnostics_channel` to collect some business events timing

    app.get('/api/debug/heap', (req, res) => {
        if (req.header('x-token') !== TOKEN) return res.sendStatus(401)
        const file = v8.writeHeapSnapshot()
        res.json({ ok: true, host: HOSTNAME, file })
    })

    app.get('/api/debug/cpu', async (req, res) => {
        if (req.header('x-token') !== TOKEN) return res.sendStatus(401)
        try {
            const file = await captureCpu(10_000)  // 10s ~ 50–100 MB
            res.json({ ok: true, host: HOSTNAME, file })
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message })
        }
    })

    app.get('/api/debug/metrics', async (req, res) => {
        if (req.header('x-token') !== TOKEN) return res.sendStatus(401)
        const metrics = (METRICS_MEMORY.length > 0) ? METRICS_MEMORY[METRICS_MEMORY.length - 1] : undefined
        res.json({ ok: true, host: HOSTNAME, metrics })
    })
}

module.exports = { addDebugTools }
