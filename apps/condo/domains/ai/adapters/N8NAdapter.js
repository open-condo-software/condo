const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { AbstractAdapter } = require('./AbstractAdapter')

/**
 * @type {{ "apiKey"?: string }|null}
 */
const AI_ADAPTERS_CONFIG = conf.AI_ADAPTERS_CONFIG ? JSON.parse(conf.AI_ADAPTERS_CONFIG) : null

class N8NAdapter extends AbstractAdapter {
    #isConfigured = false

    constructor () {
        super()

        this.#isConfigured = !!AI_ADAPTERS_CONFIG?.n8n?.apiKey
        if (!this.#isConfigured) console.warn('N8NAdapter not configured!')
    }

    get isConfigured () {
        return this.#isConfigured
    }

    async execute (predictUrl, context) {
        if (!this.isConfigured) {
            throw new Error('N8NAdapter not configured!')
        }

        const response = await fetch(
            predictUrl,
            {
                headers: {
                    'X-N8N-API-KEY': AI_ADAPTERS_CONFIG?.n8n?.apiKey,
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({ context }),
            }
        )

        if (!response.ok || response.status !== 200) {
            let developerErrorMessage = 'Failed to complete prediction'
            let parsedResponse = null
            try {
                parsedResponse = await response.json()
                developerErrorMessage = parsedResponse?.message || developerErrorMessage
            } catch (_) {
                developerErrorMessage = 'Failed to complete prediction'
            }

            const error = new Error('Failed to complete prediction')
            error.developerErrorMessage = developerErrorMessage
            error._response = parsedResponse
            throw error
        }

        const parsedResponse = await response.json()

        return {
            result: parsedResponse?.data ?? parsedResponse,
            _response: parsedResponse,
        }
    }
}

module.exports = {
    N8NAdapter,
}
