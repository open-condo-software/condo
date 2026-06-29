const { getLogger } = require('@open-condo/keystone/logging')

const DEFAULT_FORCE_TIMEOUT_MS = 15000
const DEFAULT_DRAIN_WAIT_MS = 5000
const INFLIGHT_POLL_INTERVAL_MS = 250
const KEYSTONE_DISCONNECT_TIMEOUT_MS = 3000
const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGQUIT']

/**
 * @typedef {Object} GracefulShutdownOptions
 * @property {import('express').Application} app
 * @property {{ disconnect?: () => Promise<void> }} [keystone]
 * @property {import('http').Server} [httpServer]
 * @property {import('https').Server} [httpsServer]
 * @property {(code?: number) => never} [exitFn]
 * @property {(ms: number) => Promise<void>} [sleepFn]
 * @property {number} [forceTimeoutMs]
 * @property {number} [drainWaitMs]
 */

/**
 * Registers graceful shutdown handlers for HTTP(S) servers.
 *
 * Shutdown sequence:
 * 1. Mark app as draining (readiness probe starts failing).
 * 2. Wait for load balancers to stop sending new traffic.
 * 3. Stop accepting new connections and wait for in-flight requests.
 * 4. Close remaining sockets, disconnect Keystone, exit.
 *
 * @param {GracefulShutdownOptions} options
 */
function setupGracefulShutdown ({
    app,
    keystone,
    httpServer,
    httpsServer,
    exitFn = (code) => process.exit(code),
    sleepFn = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    forceTimeoutMs = parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || String(DEFAULT_FORCE_TIMEOUT_MS)),
    drainWaitMs = parseInt(process.env.DRAIN_WAIT_MS || String(DEFAULT_DRAIN_WAIT_MS)),
}) {
    const logger = getLogger()
    const state = app.locals._grace || (app.locals._grace = { draining: false, inflight: 0 })
    const servers = [httpServer, httpsServer].filter(Boolean)
    const openSockets = new Set()

    for (const server of servers) {
        server.on('connection', (socket) => {
            openSockets.add(socket)
            socket.on('close', () => openSockets.delete(socket))
        })

        server.on('request', (_request, response) => {
            if (state.draining) {
                try {
                    response.setHeader('Connection', 'close')
                } catch {
                    // response may already be finished
                }
            }

            state.inflight += 1
            const onResponseDone = () => {
                response.removeListener('finish', onResponseDone)
                response.removeListener('close', onResponseDone)
                state.inflight = Math.max(0, state.inflight - 1)
            }
            response.on('finish', onResponseDone)
            response.on('close', onResponseDone)
        })
    }

    let isShuttingDown = false

    async function flushLogs () {
        if (typeof logger.flush !== 'function') return

        await new Promise(resolve => {
            const timeout = setTimeout(resolve, 1000)
            logger.flush(() => {
                clearTimeout(timeout)
                resolve()
            })
        })
    }

    async function runShutdown (signal) {
        if (isShuttingDown) return
        isShuttingDown = true

        try {
            state.draining = true
            logger.info({ msg: 'start graceful shutdown', data: { reason: signal } })

            if (drainWaitMs > 0) {
                await sleepFn(drainWaitMs)
            }

            for (const server of servers) {
                try {
                    server.close()
                } catch (err) {
                    logger.warn({ msg: 'server close failed', err })
                }
            }

            const inflightDeadline = Date.now() + forceTimeoutMs
            while (state.inflight > 0 && Date.now() < inflightDeadline) {
                await sleepFn(INFLIGHT_POLL_INTERVAL_MS)
            }

            for (const socket of openSockets) {
                try {
                    socket.destroy()
                } catch {
                    // ignore error
                }
            }

            if (keystone?.disconnect) {
                try {
                    await Promise.race([
                        keystone.disconnect(),
                        sleepFn(KEYSTONE_DISCONNECT_TIMEOUT_MS),
                    ])
                } catch (err) {
                    logger.error({ msg: 'keystone disconnect error', err })
                }
            }

            logger.info({
                msg: 'done',
                data: { inflight: state.inflight, openSockets: openSockets.size },
            })
            await flushLogs()
            exitFn(0)
        } catch (err) {
            logger.error({ msg: 'graceful shutdown failed', err })
            await flushLogs()
            exitFn(1)
        }
    }

    for (const signal of SHUTDOWN_SIGNALS) {
        process.on(signal, () => runShutdown(signal))
    }

    return {
        onSignal: runShutdown,
        getState: () => state,
    }
}

module.exports = {
    setupGracefulShutdown,
    DEFAULT_FORCE_TIMEOUT_MS,
    DEFAULT_DRAIN_WAIT_MS,
}
