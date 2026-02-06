const { SERIALIZERS } = require('./serializers')

describe('serializers', () => {
    it('redacts sensitive headers and cookies in request logs', () => {
        const req = {
            method: 'GET',
            url: '/api/test',
            headers: {
                authorization: 'Bearer token',
                Authorization: 'Token another',
                cookie: 'keystone.sid=abc123; other=ok',
                'proxy-authorization': 'Proxy token',
                'x-custom-header': 'keep',
            },
        }

        const result = SERIALIZERS.req(req)

        expect(result.headers.authorization).toBe('***')
        expect(result.headers.Authorization).toBe('***')
        expect(result.headers['proxy-authorization']).toBe('***')
        expect(result.headers['x-custom-header']).toBe('keep')
        expect(result.headers.cookie).toContain('keystone.sid=***')
        expect(result.headers.cookie).toContain('other=ok')
    })

    it('redacts set-cookie in response logs', () => {
        const headers = {
            'set-cookie': ['keystone.sid=abc123; Path=/; HttpOnly'],
            'x-custom-header': 'keep',
        }

        const res = {
            statusCode: 200,
            getHeader: (name) => headers[name],
            getHeaders: () => ({ ...headers }),
        }

        const result = SERIALIZERS.res(res)

        expect(result.headers['set-cookie']).toBe('***')
        expect(result.headers['x-custom-header']).toBe('keep')
    })
})
