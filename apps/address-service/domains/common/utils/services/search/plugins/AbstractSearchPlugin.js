/**
 * @typedef {Object} SearchPluginParams
 * @property {String} geo
 * @property {String} searchContext
 * @property {Object} keystoneContext
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
        this.geo = params.geo
        this.searchContext = params.searchContext
        this.keystoneContext = params.keystoneContext

        return this
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
