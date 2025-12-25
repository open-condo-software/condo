const { faker } = require('@faker-js/faker')
const express = require('express')

const { fetch } = require('@open-condo/keystone/fetch')
const { initTestExpressApp, getTestExpressApp, catchErrorFrom } = require('@open-condo/keystone/test.utils')

describe('Fetch with retries', () => {

    // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
    const app = express()
    const appName = 'TestInternalFetch'
    initTestExpressApp(appName, app)
    const handler = jest.fn()
    app.get('/', handler)

    let URL

    beforeAll(() => {
        URL = getTestExpressApp(appName).baseUrl
    })

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
        const responseData = { [faker.random.alpha(3)]: faker.random.alpha(5) }

        handler.mockImplementationOnce(async (req, res) => {
            res.json(responseData)
        })
        const response = await fetch(URL, getOptions())
        const result = await response.json()

        expect(handler).toHaveBeenCalledTimes(1)
        expect(response).toEqual(expect.objectContaining({ ok: true }))
        expect(result).toMatchObject(responseData)
    })

    it('should retry fetching data when response is not ok', async () => {
        const responseData = { [faker.random.alpha(3)]: faker.random.alpha(5) }

        handler.mockImplementationOnce(async (req, res) => {
            res.sendStatus(502)
        }).mockImplementationOnce(async (req, res) => {
            res.json(responseData)
        })

        const response = await fetch(URL, getOptions())
        const result = await response.json()

        expect(handler).toHaveBeenCalledTimes(2)
        expect(response).toEqual(expect.objectContaining({ ok: true }))
        expect(result).toMatchObject(responseData)
    })

    it('should abort request when abort timeout is reached', async () => {
        const responseData = { [faker.random.alpha(3)]: faker.random.alpha(5) }

        handler.mockImplementationOnce(async (req, res) => {
            await new Promise(resolve => setTimeout(resolve, 5000))
            res.json(responseData)
        })

        const options = getOptions({ maxRetries: 0, abortRequestTimeout: 500, timeoutBetweenRequests: 0 })

        await catchErrorFrom(async () => await fetch(URL, options), (err) => {
            expect(err).toMatchObject({
                message: 'Abort request by timeout',
            })
        })

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should work after abort timeout and then success response', async () => {
        const responseData = { [faker.random.alpha(3)]: faker.random.alpha(5) }

        handler.mockImplementationOnce(async (req, res) => {
            await new Promise(resolve => setTimeout(resolve, 5000))
            res.json(responseData)
        }).mockImplementationOnce(async (req, res) => {
            res.json(responseData)
        })

        const options = getOptions({ abortRequestTimeout: 500, timeoutBetweenRequests: 0 })
        const response = await fetch(URL, options)
        const result = await response.json()

        expect(handler).toHaveBeenCalledTimes(2)
        expect(result).toMatchObject(responseData)
    })

    it('should return response if no success response is received after all retries', async () => {
        handler.mockImplementationOnce(async (req, res) => {
            res.sendStatus(404)
        }).mockImplementationOnce(async (req, res) => {
            res.sendStatus(404)
        })

        const options = getOptions({ abortRequestTimeout: 1000 })
        const response = await fetch(URL, options)

        expect(handler).toHaveBeenCalledTimes(2)
        expect(response.ok).toBeFalsy()
        expect(response.status).toEqual(404)
    })
})
