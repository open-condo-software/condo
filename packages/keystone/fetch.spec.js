jest.mock('node-fetch', () => jest.fn())

const fetch = require('node-fetch')

const { fetch: fetchWithRetries } = require('@open-condo/keystone/fetch')

describe('Fetch with retries', () => {

    const URL = 'https://example.com/api/data'
    const getOptions = (override = {}) => ({
        maxRetries: 2,
        abortRequestTimeout: 1000,
        timeoutBetweenRequests: 100,
        ...override,
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should fetch data successfully without retries', async () => {
        const responseData = { data: 'Mock response data' }
        const response = { ok: true, json: () => Promise.resolve(responseData) }
        fetch.mockResolvedValue(response)
        const result = await fetchWithRetries(URL, getOptions())
        expect(result).toEqual(response)
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(fetch).toHaveBeenCalledWith(URL, expect.objectContaining({
            signal: expect.any(Object),
        }))
    })

    it('should retry fetching data when response is not ok', async () => {
        const responseData = { data: 'Mock response data' }
        const failResponse = { ok: false, json: () => Promise.reject(responseData) }
        const successResponse = { ok: true, json: () => Promise.resolve(responseData) }
        fetch.mockResolvedValueOnce(failResponse).mockResolvedValueOnce(successResponse)
        const result = await fetchWithRetries(URL, getOptions())
        expect(result).toEqual(successResponse)
        expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should abort request when abort timeout is reached', async () => {
        const responseData = { data: 'Mock response data' }
        const successResponse = { ok: true, json: () => Promise.resolve(responseData) }
        fetch.mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(resolve, 5000))
            return successResponse
        })
        const options = getOptions({ maxRetries: 0, abortRequestTimeout: 500, timeoutBetweenRequests: 0 })
        await expect(fetchWithRetries(URL, options))
            .rejects
            .toThrowError('Error: Abort request by timeout')
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('should work after abort timeout and then success response', async () => {
        const responseData = { data: 'Mock response data' }
        const successResponse = { ok: true, json: () => Promise.resolve(responseData) }
        fetch.mockImplementationOnce(async () => {
            // Simulate a delay longer than abortRequestTimeout
            await new Promise(resolve => setTimeout(resolve, 1500))
            return successResponse
        }).mockResolvedValueOnce(successResponse)
        const options = getOptions({ abortRequestTimeout: 500, timeoutBetweenRequests: 0 })
        const result = await fetchWithRetries(URL, options)
        expect(result).toEqual(successResponse)
        expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should return response if no success response is received in the end', async () => {
        const failResponse = {
            ok: false,
            status: 404,
            json: () => Promise.reject(new Error('Failed')),
        }
        fetch.mockResolvedValue(failResponse)
        const options = getOptions()
        const response = await fetchWithRetries(URL, options)
        expect(response.ok).toBeFalsy()
        expect(response.status).toEqual(404)
        expect(fetch).toHaveBeenCalledTimes(2)
    })

})