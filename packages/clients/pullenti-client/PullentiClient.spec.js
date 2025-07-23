// Mock the entire module before requiring anything
jest.mock('@open-condo/keystone/fetch', () => {
    const originalModule = jest.requireActual('@open-condo/keystone/fetch')
    const mockFetch = jest.fn()
    return {
        ...originalModule,
        fetch: mockFetch,
        __mockFetch: mockFetch, // Expose the mock for test assertions
    }
})

const fetchModule = require('@open-condo/keystone/fetch')

const { PullentiClient } = require('./PullentiClient')

describe('PullentiClient', () => {
    let client
    const mockUrl = 'http://test-pullenti-service'
    const mockResponse = { success: true }

    // Get the mock fetch function that was set up in the module mock
    const mockFetch = fetchModule.__mockFetch

    beforeEach(() => {
        // Reset the mock before each test
        mockFetch.mockClear()

        // Set up the default mock implementation
        mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })

        // Create a new client instance for each test
        client = new PullentiClient(mockUrl)
    })

    describe('constructor', () => {
        it('should throw an error if URL is not provided', () => {
            expect(() => new PullentiClient()).toThrow('The `url` parameter is mandatory')
        })

        it('should initialize with provided URL and options', () => {
            const customProcessor = jest.fn()
            const customClient = new PullentiClient(mockUrl, { processor: customProcessor })
            expect(customClient.url).toBe(mockUrl)
            expect(customClient.processor).toBe(customProcessor)
        })
    })

    describe('XML escaping', () => {
        const testCases = [
            { input: 'Test & Test', expected: 'Test &amp; Test' },
            { input: 'a < b', expected: 'a &lt; b' },
            { input: 'b > a', expected: 'b &gt; a' },
            { input: '"quoted"', expected: '&quot;quoted&quot;' },
            { input: '\'single quote\'', expected: '&#39;single quote&#39;' },
            { input: 'a && b || c', expected: 'a &amp;&amp; b || c' },
            { input: '<script>alert(1)</script>', expected: '&lt;script&gt;alert(1)&lt;/script&gt;' },
            { input: 123, expected: '123' },
            { input: null, expected: 'null' },
            { input: undefined, expected: 'undefined' },
        ]

        test.each(testCases)(
            'should escape XML special characters in "%s"',
            ({ input, expected }) => {
                const result = client.escapeXml(input)
                expect(result).toBe(expected)
            }
        )
    })

    describe('XML injection prevention', () => {
        const maliciousInputs = [
            '<malicious>injection</malicious>',
            'test</paramvalue><injected>hack</injected><paramvalue>',
            '&<>"\'`',
            'test</paramtype><injected>hack</injected><paramtype>',
        ]

        const testMethods = [
            { method: 'searchByText', testFn: (client, input) => client.searchByText(input, { count: 10 }), description: 'with malicious text' },
            { method: 'searchByArea', testFn: (client, input) => client.searchByArea(input, { count: 10 }), description: 'with malicious area' },
            { method: 'searchByCity', testFn: (client, input) => client.searchByCity(input, { count: 10 }), description: 'with malicious city' },
            { method: 'searchByStreet', testFn: (client, input) => client.searchByStreet(input, { count: 10 }), description: 'with malicious street' },
            { method: 'processAddress', testFn: (client, input) => client.processAddress(input), description: 'with malicious address' },
            {
                method: 'searchByParam',
                testFn: (client, input) => client.searchByParam(input, input),
                description: 'with malicious param name and value',
            },
            {
                method: 'searchByParam',
                testFn: (client, input) => client.searchByParam('test', input),
                description: 'with malicious value only',
            },
            {
                method: 'searchByParam',
                testFn: (client, input) => client.searchByParam(input, 'test'),
                description: 'with malicious param name only',
            },
            {
                method: 'searchByPullentiId',
                testFn: (client, input) => client.searchByPullentiId(input),
                description: 'with malicious pullenti id',
            },
        ]

        describe.each(testMethods)(
            'XML injection prevention for $method $description',
            ({ testFn }) => {
                test.each(maliciousInputs.map((input, index) => [input, index + 1]))(
                    'should prevent XML injection (case %#)',
                    async (malicious) => {
                        // Reset the mock before each test case
                        mockFetch.mockClear()

                        await testFn(client, malicious)

                        expect(mockFetch).toHaveBeenCalledTimes(1)
                        const [url, options] = mockFetch.mock.calls[0]
                        expect(url).toBe(mockUrl)

                        // The XML should not contain the raw malicious input
                        const requestBody = options.body
                        expect(requestBody).not.toContain(malicious)

                        // The malicious input should be properly escaped
                        const escapedMalicious = client.escapeXml(malicious)
                        expect(requestBody).toContain(escapedMalicious)
                    }
                )
            }
        )
    })

    describe('API methods', () => {
        const testAddress = 'Test Address 123'
        const testText = 'Sample text'
        const testArea = 'Test Area'
        const testCity = 'Test City'
        const testStreet = 'Test Street'
        const testGuid = '550e8400-e29b-41d4-a716-446655440000'
        const testObjectId = '12345'
        const testPullentiId = '67890'
        const testCount = 5

        const testCases = [
            { method: 'processAddress', args: [testAddress], expectedXml: `<ProcessSingleAddressText>${testAddress}</ProcessSingleAddressText>` },
            { method: 'searchByText', args: [testText, { count: testCount }], expectedXml: `<SearchObjects><searchparams><text>${testText}</text><maxcount>${testCount}</maxcount></searchparams></SearchObjects>` },
            { method: 'searchByArea', args: [testArea, { count: testCount }], expectedXml: `<SearchObjects><searchparams><area>${testArea}</area><maxcount>${testCount}</maxcount></searchparams></SearchObjects>` },
            { method: 'searchByCity', args: [testCity, { count: testCount }], expectedXml: `<SearchObjects><searchparams><city>${testCity}</city><maxcount>${testCount}</maxcount></searchparams></SearchObjects>` },
            { method: 'searchByStreet', args: [testStreet, { count: testCount }], expectedXml: `<SearchObjects><searchparams><street>${testStreet}</street><maxcount>${testCount}</maxcount></searchparams></SearchObjects>` },
            { method: 'searchByGuid', args: [testGuid], expectedXml: `<SearchObjects><searchparams><paramtype>guid</paramtype><paramvalue>${testGuid}</paramvalue></searchparams></SearchObjects>` },
            { method: 'searchByObjectId', args: [testObjectId], expectedXml: `<SearchObjects><searchparams><paramtype>objectid</paramtype><paramvalue>${testObjectId}</paramvalue></searchparams></SearchObjects>` },
            { method: 'searchByPullentiId', args: [testPullentiId], expectedXml: `<GetObject>${testPullentiId}</GetObject>` },
        ]

        test.each(testCases)(
            'should call $method with correct parameters',
            async ({ method, args, expectedXml }) => {
                await client[method](...args)

                expect(mockFetch).toHaveBeenCalledTimes(1)
                const [url, options] = mockFetch.mock.calls[0]

                expect(url).toBe(mockUrl)
                expect(options.method).toBe('POST')
                expect(options.body).toContain(expectedXml)

                // Reset mock for next test case
                mockFetch.mockClear()
            }
        )
    })

    describe('error handling', () => {
        const errorTestCases = [
            {
                name: 'fetch errors',
                setup: () => {
                    const errorMessage = 'Network error'
                    mockFetch.mockRejectedValueOnce(new Error(errorMessage))
                    return {
                        errorMessage,
                    }
                },
                testFn: (client) => client.searchByText('test', { count: 1 }),
            },
            {
                name: 'non-OK responses',
                setup: () => {
                    const errorResponse = { message: 'Invalid request' }
                    mockFetch.mockResolvedValueOnce({
                        ok: false,
                        status: 400,
                        statusText: 'Bad Request',
                        text: () => Promise.resolve(JSON.stringify(errorResponse)),
                    })
                    return {
                        errorMessage: 'Failed to fetch from Pullenti. Status 400. StatusText: Bad Request',
                    }
                },
                testFn: (client) => client.searchByText('test', { count: 1 }),
            },
        ]

        test.each(errorTestCases)(
            'should handle $name',
            async ({ setup, testFn }) => {
                const { errorMessage } = setup()
                await expect(testFn(client))
                    .rejects
                    .toThrow(errorMessage)
            }
        )
    })

    describe('processor', () => {
        it('should process response when processor is provided', async () => {
            const processor = jest.fn().mockReturnValue({ processed: true })
            const processorClient = new PullentiClient(mockUrl, { processor })

            await processorClient.searchByGuid('test-guid')

            expect(processor).toHaveBeenCalledWith(JSON.stringify(mockResponse))
        })
    })
})
