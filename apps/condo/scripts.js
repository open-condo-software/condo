const { appendFileSync } = require('fs')
const { join } = require('path')
function log (name, log) {
    appendFileSync(join(__dirname, 'logs.json'), `\n${name}\n`)
    appendFileSync(join(__dirname, 'logs.json'), JSON.stringify(log, null, 2))
}

module.exports = {
    log,
}