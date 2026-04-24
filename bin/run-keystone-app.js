// eslint-disable-next-line
const conf = require('@open-condo/config')  // Note: we need to prepare process.env first
// eslint-disable-next-line
const tracer = require('dd-trace')  // Note: required for monkey patching

/**
 * This file is based on @open-keystone/keystone/bin/commands/dev.js
 * The main reason is to add PORT environment support for `yarn dev` command!
 * You can now use command like so: `PORT=3002 yarn dev`
 * Or put PORT inside your .env file
 */
const fs = require('fs')
const https = require('https')
const path = require('path')

const chalk = require('chalk')

const { getLogger } = require('@open-condo/keystone/logging')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { getAppName, getXRemoteApp, getXRemoteClient, getXRemoteVersion } = require('@open-condo/keystone/tracingUtils')

const PORT = conf['PORT'] || '3000'
const SPORT = conf['SPORT']
const SERVER_URL = conf['SERVER_URL']
const KEY_FILE = path.join(__filename, '..', '.ssl', 'localhost.key')
const CERT_FILE = path.join(__filename, '..', '.ssl', 'localhost.pem')
const HTTPS_OPTIONS = {}
const IS_DEVELOPMENT = conf.NODE_ENV === 'development'
const IS_PRODUCTION = conf.NODE_ENV === 'production'

// NOTE: Headers must be greater than keep alive, for express 5000 / 60000 ms is default
// SRC: https://shuheikagawa.com/blog/2019/04/25/keep-alive-timeout/
const KEEP_ALIVE_TIMEOUT = parseInt(conf['KEEP_ALIVE_TIMEOUT'] || '5000')
const HEADERS_TIMEOUT = parseInt(conf['HEADERS_TIMEOUT'] || '60000')

const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production' && conf.DD_TRACE_ENABLED === 'true'

if (IS_ENABLE_DD_TRACE) {
    // Note: it's slightly modified default templates! Ported from source code.

    // eslint-disable-next-line
    const blockedTemplateHtml = path.join(__filename, '..', '.ddtrace', 'blockedTemplate.html')
    // eslint-disable-next-line
    const blockedTemplateJson = path.join(__filename, '..', '.ddtrace', 'blockedTemplate.json')
    // eslint-disable-next-line
    const blockedTemplateGraphql = path.join(__filename, '..', '.ddtrace', 'blockedTemplateGraphql.json')

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
        appsec: { blockedTemplateHtml, blockedTemplateJson, blockedTemplateGraphql },
    })
    tracer.use('express', {
        // hook will be executed right before the request span is finished
        headers: [
            'X-Remote-Client', 'X-Remote-App', 'X-Remote-Version',
            'X-Request-ID', 'X-Start-Request-ID',
            'X-Parent-Request-ID', 'X-Parent-Task-ID', 'X-Parent-Exec-ID',
        ],
        hooks: {
            request: (span, req, res) => {
                if (req?.id) span.setTag('reqId', req.id)
                if (req?.startId) span.setTag('startId', req.startId)
                if (req?.user?.id) {
                    span.setTag('userId', req.user.id)
                    tracer.setUser({ id: req.user.id, isSupport: req.user.isSupport })
                }
            },
        },
    })
}

const logger = getLogger()

try {
    if (fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE) && SPORT) {
        HTTPS_OPTIONS.key = fs.readFileSync(KEY_FILE)
        HTTPS_OPTIONS.cert = fs.readFileSync(CERT_FILE)
    }
} catch (err) {
    logger.warn({ msg: 'load certs error', err })
}

function setupGracefulShutdown ({ app, keystone, httpServer, httpsServer }) {
    const servers = [httpServer, httpsServer].filter(Boolean)
    const sockets = new Set()
    const state = app.locals._grace || (app.locals._grace = { draining: false, inflight: 0 })

    const FORCE_TIMEOUT_MS = parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '15000')
    const DRAIN_WAIT_MS = parseInt(process.env.DRAIN_WAIT_MS || '5000')

    for (const s of servers) {
        s.on('connection', (socket) => {
            sockets.add(socket)
            socket.on('close', () => sockets.delete(socket))
        })
        s.on('request', (_req, res) => {
            if (state.draining) {
                try {
                    res.setHeader('Connection', 'close')
                }
                catch {
                    // ignore error
                }
            }
            state.inflight++
            const done = () => {
                res.removeListener('finish', done)
                res.removeListener('close', done)
                state.inflight = Math.max(0, state.inflight - 1)
            }
            res.on('finish', done); res.on('close', done)
        })
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms))

    function markNotReady (reason) {
        if (state.draining) return false
        state.draining = true
        logger.info({ msg: 'graceful-shutdown:begin', data: { reason } })
        return true
    }

    async function closeServersAndWait () {
        for (const s of servers) {
            try {
                s.close()
            } catch (e) {
                logger.warn({ msg: 'server-close-failed', err: e })
            }
        }

        const deadline = Date.now() + FORCE_TIMEOUT_MS
        while (state.inflight > 0 && Date.now() < deadline) await sleep(250)

        if (sockets.size) sockets.forEach(sock => {
            try {
                sock.destroy()
            } catch {
                // ignore error
            }
        })

        try {
            if (keystone?.disconnect) await Promise.race([keystone.disconnect(), sleep(3000)])
        } catch (err) {
            logger.error({ msg: 'keystone-disconnect-error', err })
        }
        logger.info({ msg: 'graceful-shutdown:done' })
        process.exit(0)
    }

    async function onSignal (sig) {
        const first = markNotReady(sig)
        if (first && DRAIN_WAIT_MS > 0) await sleep(DRAIN_WAIT_MS)
        await closeServersAndWait()
    }

    ['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(sig => process.on(sig, () => onSignal(sig)))
}


async function main () {
    const index = path.resolve('./index.js')
    const { keystone, app } = await prepareKeystoneExpressApp(index)
    let httpServer, httpsServer

    httpServer = await new Promise((resolve, reject) => {
        const server = app.listen(PORT, (error) => {
            if (error) return reject(error)
            return resolve(server)
        })

        server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT
        server.headersTimeout = HEADERS_TIMEOUT
    })

    if (HTTPS_OPTIONS.key && HTTPS_OPTIONS.cert && SPORT) {
        httpsServer = await new Promise((resolve, reject) => {
            const server = https.createServer(HTTPS_OPTIONS, app).listen(SPORT, (error) => {
                if (error) return reject(error)
                return resolve(server)
            })

            server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT
            server.headersTimeout = HEADERS_TIMEOUT
        })
    }

    if (IS_DEVELOPMENT) {
        if (httpServer) console.log(chalk.gray.bold(`HTTP 🚀 server started on port ${PORT}`))
        if (httpsServer) console.log(chalk.green.bold(`HTTPS 🚀 server started on port ${SPORT}`))
        console.log(chalk.red.bold(`🔗🔗🔗 SERVER_URL=${SERVER_URL}`))
    } else if (IS_PRODUCTION) {
        logger.info({ msg: 'start', data: { PORT, SPORT, SERVER_URL } })
    }

    setupGracefulShutdown({ app, keystone, httpServer, httpsServer })

    return { keystone, app, httpServer, httpsServer }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
