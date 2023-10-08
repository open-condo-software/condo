/**
 * @typedef {Object} SearchPluginParams
 * @property {String} [searchContext]
 * @property {Object} keystoneContext
 * @property {IncomingMessage & {id: String}} req Express request object
 * @property {SuggestionHelpersType} [helpers]
 */

/**
 * This is an abstraction for search plugins must realize.
 */
class AbstractSearchPlugin {
    /**
     * Detects if the plugin is eligible for the current query
     * @param {String} s
     * @param {SearchPluginParams} params
     * @returns {boolean}
     */
    isEnabled (s, params) {
        return true
    }

    /**
     * @param {SearchPluginParams} params
     * @returns {AbstractSearchPlugin}
     */
    prepare (params) {
        this.searchContext = params.searchContext
        this.keystoneContext = params.keystoneContext
        this.req = params.req
        this.helpers = params.helpers

        return this
    }

    /**
     * @param {string} pluginName
     * @returns {{dv: number, sender: {dv: number, fingerprint: string}}}
     */
    getDvAndSender (pluginName) {
        return {
            dv: 1,
            sender: { dv: 1, fingerprint: `plugin:${pluginName}` },
        }
    }

    /**
     * @param {String} s
     * @returns {Promise<?Object>} The `Address` model instance
     */
    async search (s) {
        throw new Error('Method still not implemented.')
    }
}

module.exports = { AbstractSearchPlugin }
