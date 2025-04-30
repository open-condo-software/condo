const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { AbstractAdapter } = require('./AbstractAdapter')


/**
 * @type {{ "secret": string }|null}
 */
const FLOWISE_CONFIG = conf.FLOWISE_CONFIG ? JSON.parse(conf.FLOWISE_CONFIG) : null

class FlowiseAdapter extends AbstractAdapter {
    #isConfigured = false

    constructor () {
        super()

        this.#isConfigured = !!FLOWISE_CONFIG?.secret
        if (!this.#isConfigured) console.warn('FlowiseAdapter not configured!')
    }

    get isConfigured () {
        return this.#isConfigured
    }

    async execute (predictUrl, context) {
        if (!this.isConfigured) {
            throw new Error('FlowiseAdapter not configured!')
        }

        const response = await fetch(
            predictUrl,
            {
                headers: {
                    Authorization: `Bearer ${FLOWISE_CONFIG?.secret}`,
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({ question: { context } }),
            }
        )

        if (!response.ok || response.status !== 200) {
            let developerErrorMessage = 'Failed to complete prediction'
            let parsedResponse = null
            try {
                parsedResponse = await response.json()
                developerErrorMessage = parsedResponse?.message
            } catch (_) {
                developerErrorMessage = 'Failed to complete prediction'
            }

            const error = new Error('Failed to complete prediction')
            error.developerErrorMessage = developerErrorMessage
            error._response = parsedResponse
            throw error
        }

        const parsedResponse = await response.json()

        return { result: parsedResponse?.json, _response: parsedResponse }
    }
}

module.exports = {
    FlowiseAdapter,
}
