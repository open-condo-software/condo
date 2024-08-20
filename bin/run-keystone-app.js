/**
 * This file is based on @keystonejs/keystone/bin/commands/dev.js
 * The main reason is to add PORT environment support for `yarn dev` command!
 * You can now use command like so: `PORT=3002 yarn dev`
 * Or put PORT inside your .env file
 */
const fs = require('fs')
const https = require('https')
const path = require('path')

const chalk = require('chalk')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const PORT = conf['PORT'] || '3000'
const SPORT = conf['SPORT']
const SERVER_URL = conf['SERVER_URL']
const KEY_FILE = path.join(__filename, '..', '.ssl', 'localhost.key')
const CERT_FILE = path.join(__filename, '..', '.ssl', 'localhost.pem')
const HTTPS_OPTIONS = {}
const IS_DEVELOPMENT = conf.NODE_ENV === 'development'
const IS_PRODUCTION = conf.NODE_ENV === 'production'
const IS_SOCKET_EVENT_LOGS_ENABLED = conf['IS_SOCKET_EVENT_LOGS_ENABLED'] === 'true'

// NOTE: Headers must be greater than keep alive, for express 5000 / 60000 ms is default
// SRC: https://shuheikagawa.com/blog/2019/04/25/keep-alive-timeout/
const KEEP_ALIVE_TIMEOUT = parseInt(conf['KEEP_ALIVE_TIMEOUT'] || '5000')
const HEADERS_TIMEOUT = parseInt(conf['HEADERS_TIMEOUT'] || '60000')

const socketLogger = getLogger('socketLogger')
const logger = getLogger('keystone-dev')

try {
    if (fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE) && SPORT) {
        HTTPS_OPTIONS.key = fs.readFileSync(KEY_FILE)
        HTTPS_OPTIONS.cert = fs.readFileSync(CERT_FILE)
    }
} catch (err) {
    logger.warn({ msg: 'load certs error', err })
}

function configureServerSocketLogging (server) {
    if (IS_SOCKET_EVENT_LOGS_ENABLED && server != null) {
        // prepare http entities mapping functions
        const getSocketState = (socket) => {
            const {
                bytesRead, bytesWritten, timeout, readyState,
                writable, connecting, destroyed,
                localAddress, localPort,
                remoteAddress, remotePort,
            } = socket

            return {
                bytesRead, bytesWritten, timeout, readyState,
                writable, connecting, destroyed,
                localAddress, localPort,
                remoteAddress, remotePort,
            }
        }
        const getRequestState = (request) => {
            if (request == null) return
            const { headers, method, url } = request
            const reqId = headers != null ? headers['x-request-id'] : null

            return {
                headers, method, url, reqId,
            }
        }

        // handle client error according to https://nodejs.org/api/http.html#event-clienterror
        server.on('clientError', (err, socket) => {
            socketLogger.error({
                msg: 'Client error socket error occurred',
                socket: getSocketState(socket),
                err,
            })

            if (err.code === 'ECONNRESET' || !socket.writable) {
                return
            }

            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
        })

        // handle connection according to https://nodejs.org/api/http.html#event-connection
        server.on('connection', (socket) => {
            socketLogger.info({ msg: 'New tcp stream connection occurred', socket: getSocketState(socket) })
        })

        // handle dropRequest according to https://nodejs.org/api/http.html#event-droprequest
        server.on('dropRequest', (request, socket) => {
            socketLogger.info({
                msg: 'Server drop request due to maxRequestsPerSocket exceeded',
                socket: getSocketState(socket),
                request: getRequestState(request),
            })
        })

        // handle request according to https://nodejs.org/api/http.html#event-request
        server.on('request', (request, response) => {
            socketLogger.info({
                msg: 'New request to socket registered',
                socket: response.socket != null ? getSocketState(response.socket) : null,
                request: getRequestState(request),
            })
        })
    }
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

    configureServerSocketLogging(httpServer)
    configureServerSocketLogging(httpsServer)

    if (IS_DEVELOPMENT) {
        if (httpServer) console.log(chalk.gray.bold(`HTTP 🚀 server started on port ${PORT}`))
        if (httpsServer) console.log(chalk.green.bold(`HTTPS 🚀 server started on port ${SPORT}`))
        console.log(chalk.red.bold(`🔗🔗🔗 SERVER_URL=${SERVER_URL}`))
    } else if (IS_PRODUCTION) {
        logger.info({ msg: 'start', data: { PORT, SPORT, SERVER_URL } })
    }

    return { keystone, app, httpServer, httpsServer }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
