/**
 * Worker Statistics Collector
 * 
 * PURPOSE: Detailed task-level monitoring system for debugging memory leaks and performance issues.
 * This is an opt-in diagnostic tool (enabled via WORKER_STATS_ENABLE=true) that provides:
 * - Task execution history with memory deltas per task
 * - Memory growth correlation with specific task types
 * - Performance metrics by task name
 * - Fine-grained logging every 1 second
 * 
 * USE CASES:
 * - Investigating memory leaks (avgMemoryPerTask shows leak per task)
 * - Identifying which task types cause memory growth
 * - Performance profiling of worker tasks
 * - Debugging production issues with detailed task history
 * 
 * COMPARISON WITH worker.js memory monitoring:
 * - worker.js: Always-on, 10-minute intervals, no task correlation (production baseline)
 * - workerStats.js: Opt-in, 1-second intervals, task-level analysis (debugging tool)
 * 
 * Enable with: WORKER_STATS_ENABLE=true
 */

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const metrics = require('@open-condo/keystone/metrics')

const SEND_METRICS_INTERVAL_IN_MS = 1000
const MAX_LAST_TASKS_HISTORY = 50

const WORKER_STATS_ENABLE_VAR_NAME = 'WORKER_STATS_ENABLE'

const logger = getLogger('worker-stats')

const MiB = 1024 ** 2 // 1 MiB (mebibyte) = 1_048_576 B (byte)

/**
 * Captures current memory snapshot
 * @return {{ rss: number, heapTotal: number, heapUsed: number, external: number, nativeMemory: number }}
 */
function captureMemorySnapshot () {
    const mem = process.memoryUsage()
    return {
        rss: Number((mem.rss / MiB).toFixed(2)),
        heapTotal: Number((mem.heapTotal / MiB).toFixed(2)),
        heapUsed: Number((mem.heapUsed / MiB).toFixed(2)),
        external: Number((mem.external / MiB).toFixed(2)),
        nativeMemory: Number(((mem.rss - mem.heapTotal) / MiB).toFixed(2)),
    }
}

/**
 * Calculates memory delta between two snapshots
 * @param {{ rss: number, nativeMemory: number }} before
 * @param {{ rss: number, nativeMemory: number }} after
 * @return {{ rss: number, nativeMemory: number }}
 */
function calculateMemoryDelta (before, after) {
    return {
        rss: Number((after.rss - before.rss).toFixed(2)),
        nativeMemory: Number((after.nativeMemory - before.nativeMemory).toFixed(2)),
    }
}

class WorkerStatsCollector {
    constructor ({ queueName }) {
        this.queueName = queueName
        this.enabled = conf[WORKER_STATS_ENABLE_VAR_NAME] === 'true'
        this.metricsIntervalId = null
        
        this.stats = {
            startupTime: new Date().toISOString(),
            memoryAtStartup: captureMemorySnapshot(),
            
            // Current task
            currentTask: null,
            
            // Counters
            totalTasksCount: 0,
            totalTasksCountByName: {},
            failedTasksCount: 0,
            failedTasksCountByName: {},
            
            // Task history (last N tasks with memory deltas)
            lastCompletedTasks: [],
            
            // Performance tracking
            totalDurationMs: 0,
            totalDurationMsByName: {},
        }
        
        if (!this.enabled) {
            logger.info({ msg: 'worker stats disabled', queue: queueName })
        }
    }

    /**
     * Called when a task starts processing
     * @param {{ id: string, name: string, data: object }} job
     */
    onTaskStart (job) {
        if (!this.enabled) return

        const memoryAtStart = captureMemorySnapshot()
        
        this.stats.currentTask = {
            id: job.id,
            name: job.name,
            startTime: new Date().toISOString(),
            memoryAtStart,
        }
    }

    /**
     * Called when a task completes successfully
     * @param {{ id: string, name: string, data: object }} job
     * @param {number} durationMs - Task duration in milliseconds
     */
    onTaskComplete (job, durationMs) {
        if (!this.enabled) return

        const memoryAtEnd = captureMemorySnapshot()
        const memoryDelta = this.stats.currentTask 
            ? calculateMemoryDelta(this.stats.currentTask.memoryAtStart, memoryAtEnd)
            : { rss: 0, nativeMemory: 0 }

        // Update counters
        this.stats.totalTasksCount++
        this.stats.totalTasksCountByName[job.name] = (this.stats.totalTasksCountByName[job.name] || 0) + 1
        
        // Update duration tracking
        this.stats.totalDurationMs += durationMs
        this.stats.totalDurationMsByName[job.name] = (this.stats.totalDurationMsByName[job.name] || 0) + durationMs

        // Add to history
        const taskRecord = {
            id: job.id,
            name: job.name,
            startTime: this.stats.currentTask?.startTime || new Date().toISOString(),
            endTime: new Date().toISOString(),
            durationMs,
            memoryBefore: this.stats.currentTask?.memoryAtStart || memoryAtEnd,
            memoryAfter: memoryAtEnd,
            memoryDelta,
        }

        this.stats.lastCompletedTasks.unshift(taskRecord)
        if (this.stats.lastCompletedTasks.length > MAX_LAST_TASKS_HISTORY) {
            this.stats.lastCompletedTasks.pop()
        }

        // Clear current task
        this.stats.currentTask = null
    }

    /**
     * Called when a task fails
     * @param {{ id: string, name: string, data: object }} job
     * @param {number} durationMs - Task duration in milliseconds
     */
    onTaskFail (job, durationMs) {
        if (!this.enabled) return

        // Update failure counters
        this.stats.failedTasksCount++
        this.stats.failedTasksCountByName[job.name] = (this.stats.failedTasksCountByName[job.name] || 0) + 1

        // Still track as completed for memory analysis
        this.onTaskComplete(job, durationMs)
    }

    /**
     * Starts periodic metrics collection and logging
     */
    startMetricsCollection () {
        if (!this.enabled) return

        if (this.metricsIntervalId) {
            clearInterval(this.metricsIntervalId)
        }

        this.metricsIntervalId = setInterval(() => {
            this.sendMetrics()
        }, SEND_METRICS_INTERVAL_IN_MS)

        logger.info({ msg: 'worker stats enabled', queue: this.queueName })
    }

    /**
     * Sends metrics to StatsD and logs current statistics
     * @private
     */
    sendMetrics () {
        const memoryNow = captureMemorySnapshot()
        const memoryGrowth = calculateMemoryDelta(this.stats.memoryAtStartup, memoryNow)
        
        const uptimeSeconds = Math.floor((Date.now() - new Date(this.stats.startupTime).getTime()) / 1000)
        
        // Calculate averages
        const avgMemoryPerTask = this.stats.totalTasksCount > 0 
            ? {
                rss: Number((memoryGrowth.rss / this.stats.totalTasksCount).toFixed(3)),
                nativeMemory: Number((memoryGrowth.nativeMemory / this.stats.totalTasksCount).toFixed(3)),
            }
            : { rss: 0, nativeMemory: 0 }

        const avgDurationMs = this.stats.totalTasksCount > 0
            ? Math.floor(this.stats.totalDurationMs / this.stats.totalTasksCount)
            : 0

        const avgDurationByName = {}
        for (const [name, totalDuration] of Object.entries(this.stats.totalDurationMsByName)) {
            const count = this.stats.totalTasksCountByName[name] || 1
            avgDurationByName[name] = Math.floor(totalDuration / count)
        }

        // Log statistics
        logger.info({
            msg: 'current values',
            queue: this.queueName,
            workerStats: {
                totalTasksCount: this.stats.totalTasksCount,
                failedTasksCount: this.stats.failedTasksCount,
                uptimeSeconds,
                memoryAtStartup: this.stats.memoryAtStartup,
                memoryNow,
                memoryGrowth,
                currentTask: this.stats.currentTask ? {
                    id: this.stats.currentTask.id,
                    name: this.stats.currentTask.name,
                    durationMs: Date.now() - new Date(this.stats.currentTask.startTime).getTime(),
                } : null,
            },
            data: {
                totalTasksCountByName: this.stats.totalTasksCountByName,
                failedTasksCountByName: this.stats.failedTasksCountByName,
                avgDurationMs,
                avgDurationByName,
                avgMemoryPerTask,
                lastCompletedTasks: this.stats.lastCompletedTasks.slice(0, 10), // Last 10 tasks
            },
        })

        // Send metrics to StatsD
        const queueTag = this.queueName
        
        metrics.gauge({ name: 'workerStats.tasksCount.total', value: this.stats.totalTasksCount, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.failedTasksCount.total', value: this.stats.failedTasksCount, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.uptimeSeconds', value: uptimeSeconds, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.avgDurationMs', value: avgDurationMs, tags: { queue: queueTag } })
        
        // Memory metrics
        metrics.gauge({ name: 'workerStats.memory.rss', value: memoryNow.rss, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.memory.nativeMemory', value: memoryNow.nativeMemory, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.memory.heapUsed', value: memoryNow.heapUsed, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.memoryGrowth.rss', value: memoryGrowth.rss, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.memoryGrowth.nativeMemory', value: memoryGrowth.nativeMemory, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.avgMemoryPerTask.rss', value: avgMemoryPerTask.rss, tags: { queue: queueTag } })
        metrics.gauge({ name: 'workerStats.avgMemoryPerTask.nativeMemory', value: avgMemoryPerTask.nativeMemory, tags: { queue: queueTag } })

        // Per-task-name metrics
        for (const [taskName, count] of Object.entries(this.stats.totalTasksCountByName)) {
            metrics.gauge({ 
                name: 'workerStats.tasksCount.byName', 
                value: count, 
                tags: { queue: queueTag, taskName },
            })
        }

        for (const [taskName, count] of Object.entries(this.stats.failedTasksCountByName)) {
            metrics.gauge({ 
                name: 'workerStats.failedTasksCount.byName', 
                value: count, 
                tags: { queue: queueTag, taskName },
            })
        }

        for (const [taskName, avgDuration] of Object.entries(avgDurationByName)) {
            metrics.gauge({ 
                name: 'workerStats.avgDurationMs.byName', 
                value: avgDuration, 
                tags: { queue: queueTag, taskName },
            })
        }
    }

    /**
     * Stops metrics collection
     */
    stop () {
        if (this.metricsIntervalId) {
            clearInterval(this.metricsIntervalId)
            this.metricsIntervalId = null
        }
    }
}

module.exports = {
    WorkerStatsCollector,
}
