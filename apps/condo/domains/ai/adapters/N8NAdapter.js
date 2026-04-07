const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { AbstractAdapter } = require('./AbstractAdapter')

/**
 * @type {{ "your_flow_type_1": { "apiKey"?: string } | null, "your_flow_type_2": { "apiKey"?: string } | null }}
 */
const AI_ADAPTERS_CONFIG = conf.AI_ADAPTERS_CONFIG ? JSON.parse(conf.AI_ADAPTERS_CONFIG) : null

class N8NAdapter extends AbstractAdapter {
    #isConfigured = false

    constructor () {
        super()

        const flowTypes = Object.keys(AI_ADAPTERS_CONFIG?.n8n || {})
        this.#isConfigured = flowTypes.length > 0 ? flowTypes.every(flowType => !!AI_ADAPTERS_CONFIG?.n8n?.[flowType]?.apiKey) : false
        if (!this.#isConfigured) console.warn('N8NAdapter not configured for any flow type!')
    }

    get isConfigured () {
        return this.#isConfigured
    }

    async execute (flowType, predictUrl, context, onEvent) {
        if (!this.isConfigured) {
            throw new Error('N8NAdapter not configured!')
        }

        const response = await fetch(
            predictUrl,
            {
                headers: {
                    'X-N8N-API-KEY': AI_ADAPTERS_CONFIG?.n8n?.[flowType]?.apiKey,
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

        if (!response.body) {
            throw new Error('Failed to read prediction response: empty response body')
        }

        if (onEvent) {
            const decoder = new TextDecoder('utf-8')
            let answer = ''
            const events = []

            // Как обработать зависание процесса? 
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
                                answer += '\n'
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
                    if (buffer.trim()) {
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

            console.log('N8N Adapter - after responce.body - answer', answer)
            console.log('N8N Adapter - after responce.body - events', events)

            return {
                result: {
                    answer,
                },
                _response: {
                    stream: true,
                    events,
                    totalevents: eventsLength,
                    lastEventsType: eventsLength > 1 ? events[eventsLength - 1] : null,
                },
            }
        } else {
            const parsedResponse = await response.json()
            return {
                result: parsedResponse?.data ?? parsedResponse,
                _response: parsedResponse,
            }
        }
    }
}

module.exports = {
    N8NAdapter,
}

