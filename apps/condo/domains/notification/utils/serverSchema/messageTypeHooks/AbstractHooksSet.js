const { noop } = require('lodash')

/**
 * @abstract
 */
class AbstractHooksSet {

    /**
     * @param {Message} message
     */
    constructor (message) {
        this.message = message
    }

    /**
     * @returns {Promise<{shouldSend: boolean, [why]: string}>}
     */
    async shouldSend () {
        return { shouldSend: true }
    }

    /**
     * @returns {Promise<void>}
     */
    async afterSend () {
        await noop()
    }
}

module.exports = { AbstractHooksSet }
