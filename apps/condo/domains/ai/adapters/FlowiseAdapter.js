const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { AbstractAdapter } = require('./AbstractAdapter')


/**
 * @type {{ "secret": string }|null}
 */
const AI_ADAPTERS_CONFIG = conf.AI_ADAPTERS_CONFIG ? JSON.parse(conf.AI_ADAPTERS_CONFIG) : null

class FlowiseAdapter extends AbstractAdapter {
    #isConfigured = false

    constructor () {
        super()

        // In fact, the service could be accessed without authorization.
        // But for security reasons, we don't allow that — using an authorization token is mandatory!
        this.#isConfigured = !!AI_ADAPTERS_CONFIG?.flowise?.secret
        if (!this.#isConfigured) console.warn('FlowiseAdapter not configured!')
    }

    get isConfigured () {
        return this.#isConfigured
    }

    async execute (flowType, predictUrl, context, onEvent) {
        if (!this.isConfigured) {
            throw new Error('FlowiseAdapter not configured!')
        }

        const response = await fetch(
            predictUrl,
            {
                headers: {
                    Authorization: `Bearer ${AI_ADAPTERS_CONFIG?.flowise?.secret}`,
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
                developerErrorMessage = parsedResponse?.message || developerErrorMessage
            } catch (_) {
                developerErrorMessage = 'Failed to complete prediction'
            }

            const error = new Error('Failed to complete prediction')
            error.developerErrorMessage = developerErrorMessage
            error._response = parsedResponse
            throw error
        }

        if (!response.body) {
            throw new Error('Failed to read prediction response: empty response body')
        }

        if (onEvent) {
            const decoder = new TextDecoder('utf-8')
            let answer = ''
            const events = []
            let buffer = ''

            for await (const chunk of response.body) {
                buffer += decoder.decode(chunk, { stream: true })
                try {
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''
                    for (const line of lines) {
                        if (!line) continue
                        const event = JSON.parse(line)
                        events.push(event)
                        switch (event.type) {
                            case 'begin':
                                await onEvent({
                                    type: 'start',
                                    meta: event.metadata,
                                })
                                break
                            case 'item':
                                await onEvent({
                                    type: 'item',
                                    content: event.content,
                                    meta: event.metadata,
                                })
                                answer += event.content
                                break
                            case 'end':
                                await onEvent({
                                    type: 'end',
                                    meta: event.metadata,
                                })
                                break
                            default:
                                await onEvent({
                                    type: 'error',
                                    meta: event?.metadata,
                                    error: `Unknown event type: ${event.type}`,
                                })
                                throw new Error('Unknown event type')
                        }
                    }
                } catch (err) {
                    await onEvent({
                        type: 'error',
                        error: 'Failed to proccess chunk',
                    })
                    const error = new Error('Failed to proccess chunk', err)
                    error.developerErrorMessage = 'Failed to proccess chunk'
                    error._response = events.join('\n')
                    throw error
                }
            }

            buffer += decoder.decode()
            if (buffer.trim()) {
                try {
                    const event = JSON.parse(buffer.trim())
                    events.push(event)
                    switch (event.type) {
                        case 'begin':
                            await onEvent({
                                type: 'start',
                                meta: event.metadata,
                            })
                            break
                        case 'item':
                            await onEvent({
                                type: 'item',
                                content: event.content,
                                meta: event.metadata,
                            })
                            answer += event.content
                            break
                        case 'end':
                            await onEvent({
                                type: 'end',
                                meta: event.metadata,
                            })
                            break
                        default:
                            await onEvent({
                                type: 'error',
                                meta: event?.metadata,
                                error: `Unknown event type: ${event.type}`,
                            })
                            throw new Error('Unknown event type')
                    }
                } catch (err) {
                    await onEvent({
                        type: 'error',
                        error: 'Failed to proccess chunk',
                    })
                    const error = new Error('Failed to proccess chunk', err)
                    error.developerErrorMessage = 'Failed to proccess chunk'
                    error._response = events.join('\n')
                    throw error
                }
            }

            const eventsLength = events.length
            return {
                result: { answer },
                _response: {
                    stream: true,
                    events,
                    totalevents: eventsLength,
                    lastEventsType: eventsLength > 1 ? events[eventsLength - 1] : null,
                },
            }
        }

        const parsedResponse = await response.json()
        return {
            result: parsedResponse?.data ?? parsedResponse,
            _response: parsedResponse,
        }
    }
}

module.exports = {
    FlowiseAdapter,
}
