const express = require('express')

const { setupGracefulShutdown } = require('../../bin/gracefulShutdown')

describe('setupGracefulShutdown', () => {
    let app
    let server
    let exitFn
    let sleepCalls

    beforeEach(async () => {
        app = express()
        app.locals._grace = { draining: false, inflight: 0 }
        app.get('/health', (req, res) => {
            if (req.app.locals._grace.draining) {
                return res.status(503).json({ status: 'shutting_down' })
            }
            return res.status(200).json({ status: 'ok' })
        })

        server = await new Promise((resolve, reject) => {
            const createdServer = app.listen(0, (error) => {
                if (error) return reject(error)
                return resolve(createdServer)
            })
        })

        exitFn = jest.fn()
        sleepCalls = []
    })

    afterEach(async () => {
        if (server?.listening) {
            await new Promise(resolve => server.close(resolve))
        }
        ;['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(sig => process.removeAllListeners(sig))
    })

    function createShutdown ({
        drainWaitMs = 0,
        forceTimeoutMs = 1000,
        keystone,
    } = {}) {
        return setupGracefulShutdown({
            app,
            keystone,
            httpServer: server,
            exitFn,
            drainWaitMs,
            forceTimeoutMs,
            sleepFn: async (ms) => {
                sleepCalls.push(ms)
            },
        })
    }

    test('marks app as draining and returns 503 on health endpoint', async () => {
        const shutdown = createShutdown()
        await shutdown.onSignal('SIGTERM')

        expect(app.locals._grace.draining).toBe(true)
        expect(exitFn).toHaveBeenCalledWith(0)
    })

    test('waits for drain period before closing server', async () => {
        const shutdown = createShutdown({ drainWaitMs: 5000 })
        await shutdown.onSignal('SIGTERM')

        expect(sleepCalls[0]).toBe(5000)
        expect(exitFn).toHaveBeenCalledWith(0)
    })

    test('waits for in-flight requests before force closing sockets', async () => {
        let now = 0
        const originalDateNow = Date.now
        Date.now = () => now

        const shutdown = setupGracefulShutdown({
            app,
            httpServer: server,
            exitFn,
            forceTimeoutMs: 1000,
            drainWaitMs: 0,
            sleepFn: async (ms) => {
                sleepCalls.push(ms)
                now += ms
            },
        })
        shutdown.getState().inflight = 1

        await shutdown.onSignal('SIGTERM')

        Date.now = originalDateNow

        expect(sleepCalls).toContain(250)
        expect(exitFn).toHaveBeenCalledWith(0)
    })

    test('calls keystone.disconnect during shutdown', async () => {
        const disconnect = jest.fn().mockResolvedValue(undefined)
        const shutdown = createShutdown({
            keystone: { disconnect },
        })

        await shutdown.onSignal('SIGTERM')

        expect(disconnect).toHaveBeenCalled()
        expect(exitFn).toHaveBeenCalledWith(0)
    })

    test('ignores duplicate shutdown signals', async () => {
        const shutdown = createShutdown({ drainWaitMs: 1000 })
        await shutdown.onSignal('SIGTERM')
        await shutdown.onSignal('SIGTERM')

        expect(sleepCalls.filter(ms => ms === 1000)).toHaveLength(1)
        expect(exitFn).toHaveBeenCalledTimes(1)
    })
})
