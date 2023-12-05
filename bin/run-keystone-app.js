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

const logger = getLogger('keystone-dev')

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
    })

    if (HTTPS_OPTIONS.key && HTTPS_OPTIONS.cert && SPORT) {
        httpsServer = await new Promise((resolve, reject) => {
            const server = https.createServer(HTTPS_OPTIONS, app).listen(SPORT, (error) => {
                if (error) return reject(error)
                return resolve(server)
            })
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
