class AbstractAdapter {
    /**
     * @return {boolean}
     */
    get isConfigured () {
        throw new Error('Getter not implemented!')
    }

    /**
     * @param {string} flowType
     * @param {string} predictUrl
     * @param {object} context
     * @param {(event: { type: string, content?: string, meta?: object }) => Promise<void>|void} onEvent
     * @return {Promise<{result: object, _response: any}>}
     */
    async execute (flowType, predictUrl, context, onEvent) {
        throw new Error('Method not implemented!')
    }
}

module.exports = {
    AbstractAdapter,
}
