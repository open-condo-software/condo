const conf = require('@open-condo/config')

const SPP_CONFIG = JSON.parse(conf['SPP_CONFIG'] || '{}')

// Separating get-func from const for mocking inside test
function getSPPConfig () {
    return SPP_CONFIG
}

module.exports = {
    getSPPConfig,
}