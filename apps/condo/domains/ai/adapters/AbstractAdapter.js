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
     * @param {string} flowType
     * @param {(event: { type: string, content?: string, meta?: object, error?: string }) => Promise<void>|void} onEvent
     * @return {Promise<{result: object, _response: any}>}
     */
    async execute (predictUrl, context, flowType, onEvent) {
        throw new Error('Method not implemented!')
    }
}

module.exports = {
    AbstractAdapter,
}
