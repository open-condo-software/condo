class AbstractAdapter {
    /**
     * @return {boolean}
     */
    get isConfigured () {
        throw new Error('Getter not implemented!')
    }

    /**
     * @param {string} predictUrl
     * @param {object} context
     * @return {Promise<{result: string, _fullResult: any}>}
     */
    async execute (predictUrl, context) {
        throw new Error('Method not implemented!')
    }
}

module.exports = {
    AbstractAdapter,
}
