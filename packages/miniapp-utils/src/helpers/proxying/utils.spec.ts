import { replaceUpstreamEndpoint } from './utils'


describe('proxying utils', () => {
    describe('replaceUpstreamEndpoint', () => {
        const upstreamOrigin = 'https://condo.upstream.com'
        const upstreamPrefix = '/oidc'
        const proxyPrefix = '/api/proxy'
        const defaultOptions = {
            upstreamOrigin,
            upstreamPrefix,
            proxyPrefix,
        }

        describe('Must replace prefixes if come from same origin', () => {
            describe.each([
                ['/oidc/some/path', '/api/proxy/some/path'],
                ['/oidc/some/path?a=1&b=2&a=3', '/api/proxy/some/path?a=1&b=2&a=3'],
                ['/oidc/some/path?a=1&b=2&a=3#fragment', '/api/proxy/some/path?a=1&b=2&a=3#fragment'],
            ])('%p', (upstreamEndpoint, expected) => {
                test.each(['absolute', 'relative'])('%p endpoint', (endpointType) => {
                    const endpoint = endpointType === 'absolute' ? `${upstreamOrigin}${upstreamEndpoint}` : upstreamEndpoint
                    expect(replaceUpstreamEndpoint({
                        endpoint,
                        ...defaultOptions,
                    })).toBe(expected)
                })
            })
        })
        test('Must not replace prefixes if come from another origin', () => {
            const endpoint = 'https://condo.downstream.com/oidc/some/path'
            expect(replaceUpstreamEndpoint({
                endpoint,
                ...defaultOptions,
            })).toBe(endpoint)
        })
        describe('Must not replace endpoint if its not redirecting to upstreamPrefix', () => {
            const upstreamEndpoint = '/some/other/endpoint'
            test.each(['absolute', 'relative'])('%p endpoint', (endpointType) => {
                const endpoint = endpointType === 'absolute' ? `${upstreamOrigin}${upstreamEndpoint}` : upstreamEndpoint
                expect(replaceUpstreamEndpoint({
                    endpoint,
                    ...defaultOptions,
                })).toBe(endpoint)
            })
        })
        describe('Must correctly replace endpoints if rewrites specified', () => {
            describe('On same domain must lookup for relative and absolute mapping', () => {
                describe.each([
                    {
                        description: 'should rewrite using pathname lookup',
                        endpoint: '/oidc/callback',
                        rewrites: { '/oidc/callback': '/page?param=1' } as Record<string, string>,
                        expected: '/page?param=1',
                    },
                    {
                        description: 'should rewrite using absolute URL lookup',
                        endpoint: '/oidc/callback',
                        rewrites: { 'https://condo.upstream.com/oidc/callback': '/page?param=1' } as Record<string, string>,
                        expected: '/page?param=1',
                    },
                    {
                        description: 'should merge query parameters correctly',
                        endpoint: '/oidc/callback?original=1',
                        rewrites: { '/oidc/callback': '/page?param=new&extra=2' } as Record<string, string>,
                        expected: '/page?original=1&param=new&extra=2',
                    },
                    {
                        description: 'should preserve hash when rewriting',
                        endpoint: '/oidc/callback?original=1#section',
                        rewrites: { '/oidc/callback': '/page?param=1' } as Record<string, string>,
                        expected: '/page?original=1&param=1#section',
                    },
                ])('$description', ({ endpoint: upstreamEndpoint, rewrites, expected }) => {
                    test.each(['absolute', 'relative'])('%p endpoint', (endpointType) => {
                        const endpoint = endpointType === 'absolute' ? `${upstreamOrigin}${upstreamEndpoint}` : upstreamEndpoint
                        expect(replaceUpstreamEndpoint({
                            endpoint,
                            rewrites,
                            ...defaultOptions,
                        })).toBe(expected)
                    })
                })
            })
            describe('On different domain must lookup for absolute mapping', () => {
                test.each([
                    {
                        description: 'should rewrite using absolute URL lookup',
                        endpoint: 'https://different-domain.com/some/path',
                        rewrites: { 'https://different-domain.com/some/path': '/page?param=1' } as Record<string, string>,
                        expected: '/page?param=1',
                    },
                    {
                        description: 'should return absolute URL when target is absolute',
                        endpoint: 'https://different-domain.com/some/path',
                        rewrites: { 'https://different-domain.com/some/path': 'https://example.com/page?param=1' } as Record<string, string>,
                        expected: 'https://example.com/page?param=1',
                    },
                    {
                        description: 'should merge query parameters correctly',
                        endpoint: 'https://different-domain.com/some/path?original=1',
                        rewrites: { 'https://different-domain.com/some/path': '/page?param=new' } as Record<string, string>,
                        expected: '/page?original=1&param=new',
                    },
                    {
                        description: 'should not rewrite using pathname lookup for different domain',
                        endpoint: 'https://different-domain.com/oidc/callback',
                        rewrites: { '/oidc/callback': '/page?param=1' } as Record<string, string>,
                        expected: 'https://different-domain.com/oidc/callback',
                    },
                ])('$description', ({ endpoint, rewrites, expected }) => {
                    expect(replaceUpstreamEndpoint({
                        endpoint,
                        rewrites,
                        ...defaultOptions,
                    })).toBe(expected)
                })
            })
            describe('Must keep query-parameters from rewrite', () => {
                describe.each([
                    {
                        description: 'should preserve original query parameters when rewrite has none',
                        endpoint: '/oidc/callback?original=1&other=2',
                        rewrites: { '/oidc/callback': '/page' } as Record<string, string>,
                        expected: '/page?original=1&other=2',
                    },
                    {
                        description: 'should add rewrite query parameters to original ones',
                        endpoint: '/oidc/callback?original=1',
                        rewrites: { '/oidc/callback': '/page?new=param' } as Record<string, string>,
                        expected: '/page?original=1&new=param',
                    },
                    {
                        description: 'should handle multiple query parameters from both sources',
                        endpoint: '/oidc/callback?a=1&b=2',
                        rewrites: { '/oidc/callback': '/page?c=3&d=4' } as Record<string, string>,
                        expected: '/page?a=1&b=2&c=3&d=4',
                    },
                ])('$description', ({ endpoint: upstreamEndpoint, rewrites, expected }) => {
                    test.each(['absolute', 'relative'])('%p endpoint', (endpointType) => {
                        const endpoint = endpointType === 'absolute' ? `${upstreamOrigin}${upstreamEndpoint}` : upstreamEndpoint
                        expect(replaceUpstreamEndpoint({
                            endpoint,
                            rewrites,
                            ...defaultOptions,
                        })).toBe(expected)
                    })
                })
            })
            describe('Must override query-parameter with value from rewrites if specified on both endpoints', () => {
                describe.each([
                    {
                        description: 'should override single parameter with rewrite value',
                        endpoint: '/oidc/callback?param=original',
                        rewrites: { '/oidc/callback': '/page?param=new' } as Record<string, string>,
                        expected: '/page?param=new',
                    },
                    {
                        description: 'should override multiple parameters with rewrite values',
                        endpoint: '/oidc/callback?param1=original1&param2=original2',
                        rewrites: { '/oidc/callback': '/page?param1=new1&param2=new2' } as Record<string, string>,
                        expected: '/page?param1=new1&param2=new2',
                    },
                    {
                        description: 'should override some parameters while keeping others',
                        endpoint: '/oidc/callback?param1=original1&param2=original2&keep=this',
                        rewrites: { '/oidc/callback': '/page?param1=new1&param2=new2' } as Record<string, string>,
                        expected: '/page?keep=this&param1=new1&param2=new2',
                    },
                ])('$description', ({ endpoint: upstreamEndpoint, rewrites, expected }) => {
                    test.each(['absolute', 'relative'])('%p endpoint', (endpointType) => {
                        const endpoint = endpointType === 'absolute' ? `${upstreamOrigin}${upstreamEndpoint}` : upstreamEndpoint
                        expect(replaceUpstreamEndpoint({
                            endpoint,
                            rewrites,
                            ...defaultOptions,
                        })).toBe(expected)
                    })
                })
            })
            describe('Must keep hash from rewrite', () => {
                describe.each([
                    {
                        description: 'should preserve original hash when rewrite has none',
                        endpoint: '/oidc/callback#original-hash',
                        rewrites: { '/oidc/callback': '/page' } as Record<string, string>,
                        expected: '/page#original-hash',
                    },
                    {
                        description: 'should preserve original hash with query parameters',
                        endpoint: '/oidc/callback?param=1#original-hash',
                        rewrites: { '/oidc/callback': '/page?new=param' } as Record<string, string>,
                        expected: '/page?param=1&new=param#original-hash',
                    },
                    {
                        description: 'should handle hash without query parameters',
                        endpoint: '/oidc/callback#section',
                        rewrites: { '/oidc/callback': '/page?param=1' } as Record<string, string>,
                        expected: '/page?param=1#section',
                    },
                ])('$description', ({ endpoint: upstreamEndpoint, rewrites, expected }) => {
                    test.each(['absolute', 'relative'])('%p endpoint', (endpointType) => {
                        const endpoint = endpointType === 'absolute' ? `${upstreamOrigin}${upstreamEndpoint}` : upstreamEndpoint
                        expect(replaceUpstreamEndpoint({
                            endpoint,
                            rewrites,
                            ...defaultOptions,
                        })).toBe(expected)
                    })
                })
            })
            describe('Must override hash with value from rewrites if specified on both endpoints', () => {
                describe.each([
                    {
                        description: 'should override hash with rewrite value',
                        endpoint: '/oidc/callback#original-hash',
                        rewrites: { '/oidc/callback': '/page#new-hash' } as Record<string, string>,
                        expected: '/page#new-hash',
                    },
                    {
                        description: 'should override hash and merge query parameters',
                        endpoint: '/oidc/callback?param=1#original-hash',
                        rewrites: { '/oidc/callback': '/page?new=param#new-hash' } as Record<string, string>,
                        expected: '/page?param=1&new=param#new-hash',
                    },
                    {
                        description: 'should keep hash from endpoint when rewrite has none',
                        endpoint: '/oidc/callback#original-hash',
                        rewrites: { '/oidc/callback': '/page' } as Record<string, string>,
                        expected: '/page#original-hash',
                    },
                ])('$description', ({ endpoint: upstreamEndpoint, rewrites, expected }) => {
                    test.each(['absolute', 'relative'])('%p endpoint', (endpointType) => {
                        const endpoint = endpointType === 'absolute' ? `${upstreamOrigin}${upstreamEndpoint}` : upstreamEndpoint
                        expect(replaceUpstreamEndpoint({
                            endpoint,
                            rewrites,
                            ...defaultOptions,
                        })).toBe(expected)
                    })
                })
            })
        })
    })
})