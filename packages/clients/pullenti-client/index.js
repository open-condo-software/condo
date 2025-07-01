const get = require('lodash/get')

const conf = require('@open-condo/config')

const { PullentiClient } = require('./PullentiClient')

const CONFIG_KEY = 'PULLENTI_CONFIG'
const CONFIG_KEY_URL = 'url'

/**
 * @type {PullentiClient}
 */
let instance

/**
 * Creates a singleton instance of PullentiClient using the configuration from environment variables.
 * @param {import('./PullentiClient').PullentiClientOptions} options
 * @returns {PullentiClient}
 * @throws {Error} If the configuration is not set or invalid.
 */
function createInstance (options) {
    const configStr = get(conf, CONFIG_KEY)
    if (!configStr) {
        throw new Error(`There is no '${CONFIG_KEY}' in .env.`)
    }

    /**
     * @type {{url:string} | null}
     */
    const configJson = JSON.parse(configStr)

    const url = get(configJson, CONFIG_KEY_URL)
    if (!url) {
        throw new Error(`There is no '${CONFIG_KEY_URL}' in '${CONFIG_KEY}'.`)
    }
    
    if (!instance) {
        instance = new PullentiClient(url, options)
    }

    return instance
}

module.exports = { createInstance }
