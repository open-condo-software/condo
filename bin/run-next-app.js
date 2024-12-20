const fs = require('fs')
const https = require('https')
const path = require('path')

const next = require('next')

const conf = require('@open-condo/config')


const PORT = conf['PORT'] || '3000'
const SPORT = conf['SPORT']


const KEY_FILE = path.join(__filename, '..', '.ssl', 'localhost.key')
const CERT_FILE = path.join(__filename, '..', '.ssl', 'localhost.pem')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    https.createServer({
        key: fs.readFileSync(KEY_FILE),
        cert: fs.readFileSync(CERT_FILE),
    }, (req, res) => {
        handle(req, res)
    }).listen(SPORT, 'callcenter.app.localhost', (err) => {
        if (err) throw err
        console.log(`> Ready on https://callcenter.app.localhost:${SPORT}`)
    })
})
