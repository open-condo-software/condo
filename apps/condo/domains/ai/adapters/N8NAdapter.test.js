const TEST_API_KEY = 'test-n8n-api-key'

const createAdapter = async (config = { AI_ADAPTERS_CONFIG: JSON.stringify({ n8n: { apiKey: TEST_API_KEY } }) }) => {
    jest.resetModules()

    const fetchMock = jest.fn()

    jest.doMock('@open-condo/config', () => config, { virtual: true })
    jest.doMock('@open-condo/keystone/fetch', () => ({ fetch: fetchMock }), { virtual: true })

    const { N8NAdapter } = require('./N8NAdapter')

    return { adapter: new N8NAdapter(), fetchMock }
}

describe('N8NAdapter', () => {
    let consoleWarnSpy

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        consoleWarnSpy.mockRestore()
    })

    test('marks adapter as configured when API key provided', async () => {
        const { adapter } = await createAdapter()

        expect(adapter.isConfigured).toBe(true)
    })

    test('sends context payload with API key header and returns parsed data field', async () => {
        const { adapter, fetchMock } = await createAdapter()

        const successResponse = {
            data: { answer: 'mocked answer' },
            executionId: 'execution-id',
        }

        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(successResponse),
        })

        const result = await adapter.execute('https://n8n.example/webhook', { foo: 'bar' })

        expect(fetchMock).toHaveBeenCalledWith('https://n8n.example/webhook', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'X-N8N-API-KEY': TEST_API_KEY,
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({ context: { foo: 'bar' } }),
        }))
        expect(result).toEqual({
            result: successResponse.data,
            _response: successResponse,
        })
    })

    test('falls back to parsed body when data field is missing', async () => {
        const { adapter, fetchMock } = await createAdapter()

        const successResponse = { answer: 'raw response' }

        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(successResponse),
        })

        const result = await adapter.execute('https://n8n.example/webhook', { foo: 'bar' })

        expect(result).toEqual({
            result: successResponse,
            _response: successResponse,
        })
    })

    test('throws error when adapter is not configured', async () => {
        const { adapter } = await createAdapter({})

        expect(adapter.isConfigured).toBe(false)
        await expect(adapter.execute('https://n8n.example/webhook', {})).rejects.toThrow('N8NAdapter not configured!')
    })

    test('throws error with developer message when response is not successful', async () => {
        const { adapter, fetchMock } = await createAdapter()

        const errorResponse = { message: 'Workflow execution failed' }

        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            json: jest.fn().mockResolvedValue(errorResponse),
        })

        await expect(adapter.execute('https://n8n.example/webhook', { foo: 'bar' })).rejects.toMatchObject({
            message: 'Failed to complete prediction',
            developerErrorMessage: 'Workflow execution failed',
            _response: errorResponse,
        })
    })

    test('uses default developer message when parsing response fails', async () => {
        const { adapter, fetchMock } = await createAdapter()

        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            json: jest.fn().mockRejectedValue(new Error('Parse error')),
        })

        await expect(adapter.execute('https://n8n.example/webhook', { foo: 'bar' })).rejects.toMatchObject({
            message: 'Failed to complete prediction',
            developerErrorMessage: 'Failed to complete prediction',
            _response: null,
        })
    })
})
