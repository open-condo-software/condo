// eslint-disable-next-line
const conf = require('@open-condo/config')  // Note: we need to prepare process.env first
// eslint-disable-next-line
const tracer = require('dd-trace')  // Note: required for monkey patching

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
    const blockedTemplateHtml = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You\'ve been blocked</title><style>a,body,div,html,span{margin:0;padding:0;border:0;font-size:100%;font:inherit;vertical-align:baseline}body{background:-webkit-radial-gradient(26% 19%,circle,#fff,#f4f7f9);background:radial-gradient(circle at 26% 19%,#fff,#f4f7f9);display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-ms-flex-line-pack:center;align-content:center;width:100%;min-height:100vh;line-height:1;flex-direction:column}p{display:block}main{text-align:center;flex:1;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-ms-flex-line-pack:center;align-content:center;flex-direction:column}p{font-size:18px;line-height:normal;color:#646464;font-family:sans-serif;font-weight:400}a{color:#4842b7}footer{width:100%;text-align:center}footer p{font-size:16px}</style></head><body><main><p>ERROR: BLOCK_BY_WAF</p></main></body></html>'
    // eslint-disable-next-line
    const blockedTemplateJson = '{"errors":[{"title":"You\'ve been blocked","detail":"Sorry, you cannot access this page. Please contact the customer service team. ERROR: BLOCK_BY_WAF"}]}'
    // eslint-disable-next-line
    const blockedTemplateGraphql = '{"errors":[{"message":"You\'ve been blocked","extensions":{"detail":"Sorry, you cannot perform this operation. Please contact the customer service team. ERROR: BLOCK_BY_WAF"}}]}'

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

const logger = getLogger('run-keystone')

try {
    if (fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE) && SPORT) {
        HTTPS_OPTIONS.key = fs.readFileSync(KEY_FILE)
        HTTPS_OPTIONS.cert = fs.readFileSync(CERT_FILE)
    }
} catch (err) {
    logger.warn({ msg: 'load certs error', err })
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

    return { keystone, app, httpServer, httpsServer }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
