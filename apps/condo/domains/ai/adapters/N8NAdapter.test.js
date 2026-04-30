const TEST_API_KEY = 'test-n8n-api-key'
const TEST_FLOW_TYPE = 'testFlow'

const createAdapter = async (
    config = { AI_ADAPTERS_CONFIG: JSON.stringify({ n8n: { [TEST_FLOW_TYPE]: { apiKey: TEST_API_KEY } } }) }
) => {
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
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue(successResponse),
        })

        const result = await adapter.execute('https://n8n.example/webhook', { foo: 'bar' }, TEST_FLOW_TYPE)

        expect(fetchMock).toHaveBeenCalledWith('https://n8n.example/webhook', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: `Bearer ${TEST_API_KEY}`,
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
            headers: { get: jest.fn().mockReturnValue(null) },
            json: jest.fn().mockResolvedValue(successResponse),
        })

        const result = await adapter.execute('https://n8n.example/webhook', { foo: 'bar' }, TEST_FLOW_TYPE)

        expect(result).toEqual({
            result: successResponse,
            _response: successResponse,
        })
    })

    test('throws error when adapter is not configured', async () => {
        const { adapter } = await createAdapter({})

        expect(adapter.isConfigured).toBe(false)
        await expect(adapter.execute('https://n8n.example/webhook', {}, TEST_FLOW_TYPE)).rejects.toThrow('N8NAdapter not configured!')
    })

    test('throws error with developer message when response is not successful', async () => {
        const { adapter, fetchMock } = await createAdapter()

        const errorResponse = { message: 'Workflow execution failed' }

        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            json: jest.fn().mockResolvedValue(errorResponse),
        })

        await expect(adapter.execute('https://n8n.example/webhook', { foo: 'bar' }, TEST_FLOW_TYPE)).rejects.toMatchObject({
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

        await expect(adapter.execute('https://n8n.example/webhook', { foo: 'bar' }, TEST_FLOW_TYPE)).rejects.toMatchObject({
            message: 'Failed to complete prediction',
            developerErrorMessage: 'Failed to complete prediction',
            _response: null,
        })
    })

    test('throws error when API key is not configured for flow', async () => {
        const { adapter } = await createAdapter({
            AI_ADAPTERS_CONFIG: JSON.stringify({ n8n: { anotherFlow: { apiKey: TEST_API_KEY } } }),
        })

        await expect(adapter.execute('https://n8n.example/webhook', { foo: 'bar' }, TEST_FLOW_TYPE)).rejects.toThrow(
            `N8NAdapter apiKey is not configured for flow "${TEST_FLOW_TYPE}"`
        )
    })
})
