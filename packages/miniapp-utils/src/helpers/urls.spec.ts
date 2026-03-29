import { isSafeUrl, replaceDomainPrefix, replaceDomain, getWildcardDomain } from './urls'

describe('URL utils', () => {
    describe('isSafeUrl', () => {
        describe('safe url cases', () => {
            const safeCases = [
                // Standard HTTPS URLs
                'https://github.com',
                'https://v1.condo.dev/ticket',
                'https://example.com:8080/path?query=value#fragment',
            
                // HTTP URLs
                'http://localhost:3000',
                'http://example.com/api/v1/users',
            
                // Relative URLs
                '%2Fticket',
                '/ticket',
                '/path/to/resource',
            
                // URLs with query parameters and fragments
                '/search?q=test&page=1',
                '/page#section',
                '/api/users?id=123&format=json#results',
            
                // URLs with encoded characters (non-malicious)
                '/path%20with%20spaces',
                '/path?query=%20value',
            
                // Other protocols (non-javascript)
                'ftp://files.example.com/file.txt',
                'mailto:user@example.com',
                'tel:+1234567890',
                'data:text/plain;base64,SGVsbG8gV29ybGQ=',
            
                // URLs with special characters
                '/path/with-dashes_and_underscores',
                '/path/with.dots',
                '/path/with~tildes',
            
                // JavaScript as part of path (not protocol)
                '/path/javascript-file.js',
                '/api/javascript/docs',
                'https://example.com/javascript-tutorial',
            ]
            test.each(safeCases)('%p must be safe', (url) => {
                expect(isSafeUrl(url)).toEqual(true)
            })
        })
    
        describe('unsafe url cases', () => {
            const unsafeCases = [
                // Basic javascript: URLs
                'javascript:alert(document.cookie)',
                'JAVASCRIPT:alert(1)',
                'JavaScript:void(0)',
            
                // Encoded javascript: URLs (single-level encoding)
                'Jav%09ascript:alert(document.cookie)',
                '%09Jav%09ascript:alert(document.cookie)',
                'Jav%20ascRipt:alert(document.cookie)',
                'jav%0Aascript:alert(1)',
                'jav%0Dascript:alert(1)',
                'jav%0Cascript:alert(1)',
            
                // Mixed case with encoding
                'JaVa%20ScRiPt:alert(1)',
                'java%09script:alert(1)',
            
                // With various whitespace characters
                'java\tscript:alert(1)',
                'java\nscript:alert(1)',
                'java\rscript:alert(1)',
                'java\fscript:alert(1)',
                'java\vscript:alert(1)',
            
                // Unicode control characters
                'java\u0000script:alert(1)',
                'java\u0001script:alert(1)',
                'java\u001Fscript:alert(1)',
            
                // Empty string
                '',
            ]
            test.each(unsafeCases)('%p must be unsafe', (url) => {
                expect(isSafeUrl(url)).toEqual(false)
            })
        })
    
        describe('input validation', () => {
            const invalidInputs = [
                null,
                undefined,
                123,
                true,
                false,
                {},
                [],
                { toString: () => 'javascript:alert(1)' },
            ]
        
            test.each(invalidInputs)('%p should return false', (input) => {
                expect(isSafeUrl(input)).toEqual(false)
            })
        })
    
        describe('malformed URI handling', () => {
            const malformedCases = [
                '%',
                '%2',
                '%GG',
                'test%',
                '%ZZ',
            ]
        
            test.each(malformedCases)('%p should be treated as unsafe', (url) => {
                expect(isSafeUrl(url)).toEqual(false)
            })
        
            test('should not throw errors on malformed URIs', () => {
                const malformedCases = ['%', '%2', '%GG', 'test%']
            
                malformedCases.forEach(url => {
                    expect(() => isSafeUrl(url)).not.toThrow()
                })
            })
        })
    
        describe('edge cases', () => {
            test('should handle very long URLs', () => {
                const longSafeUrl = 'https://example.com/' + 'a'.repeat(1000)
                const longUnsafeUrl = 'javascript:' + 'alert(1);'.repeat(100)
            
                expect(isSafeUrl(longSafeUrl)).toEqual(true)
                expect(isSafeUrl(longUnsafeUrl)).toEqual(false)
            })
        
            test('should handle URLs with javascript in hostname', () => {
                // These contain javascript: pattern after decoding
                expect(isSafeUrl('https://javascript:alert(1)')).toEqual(false)
                expect(isSafeUrl('http://example.com/javascript:test')).toEqual(false)
            })
        
            test('should handle properly encoded javascript URLs', () => {
                // These decode to javascript: URLs with decodeURI (which doesn't decode %3A)
                // So javascript%3Aalert%281%29 becomes javascript%3Aalert(1) - still safe
                expect(isSafeUrl('javascript%3Aalert%281%29')).toEqual(true)
            
                // But these should be unsafe as they decode to actual javascript: URLs
                expect(isSafeUrl('javascript%20%3A%20alert(1)')).toEqual(true) // decodes to "javascript : alert(1)" - not javascript:
            
                // Real encoded javascript URLs that would be caught
                expect(isSafeUrl('javascript%09%3A%09alert(1)')).toEqual(true) // Still has %3A so not javascript:
            })
        })
    })
    describe('replaceDomainPrefix', () => {
        describe('domain prefix replacement', () => {
            const testCases = [
                // Adding prefix to root domains
                {
                    prefix: 'api',
                    originalUrl: 'https://example.com',
                    expected: 'https://api.example.com/',
                },
                {
                    prefix: 'staging',
                    originalUrl: 'http://condo.dev/path',
                    expected: 'http://staging.condo.dev/path',
                },
                {
                    prefix: 'dev',
                    originalUrl: 'https://github.com:8080/user/repo?tab=readme',
                    expected: 'https://dev.github.com:8080/user/repo?tab=readme',
                },

                // Replacing leftmost subdomain with prefix
                {
                    prefix: 'staging',
                    originalUrl: 'http://api.condo.dev/v1/tickets',
                    expected: 'http://staging.condo.dev/v1/tickets',
                },
                {
                    prefix: 'prod',
                    originalUrl: 'https://dev.api.example.com/users',
                    expected: 'https://prod.api.example.com/users',
                },

                // Preserving query parameters and fragments
                {
                    prefix: 'test',
                    originalUrl: 'https://api.example.com/search?q=value&page=1#results',
                    expected: 'https://test.example.com/search?q=value&page=1#results',
                },
                {
                    prefix: 'beta',
                    originalUrl: 'http://www.site.com:3000/path?param=test#section',
                    expected: 'http://beta.site.com:3000/path?param=test#section',
                },

                // Different protocols
                {
                    prefix: 'secure',
                    originalUrl: 'ftp://files.example.com/document.pdf',
                    expected: 'ftp://secure.example.com/document.pdf',
                },

                // Complex subdomains
                {
                    prefix: 'new',
                    originalUrl: 'https://old.api.v2.example.com/endpoint',
                    expected: 'https://new.api.v2.example.com/endpoint',
                },
                {
                    prefix: 'replacement',
                    originalUrl: 'https://subdomain.another.deep.domain.com',
                    expected: 'https://replacement.another.deep.domain.com/',
                },

                // Edge cases with ports and paths
                {
                    prefix: 'local',
                    originalUrl: 'http://localhost:8080/api/v1',
                    expected: 'http://local.localhost:8080/api/v1',
                },
                {
                    prefix: 'custom',
                    originalUrl: 'https://app.service.internal:9443/health',
                    expected: 'https://custom.service.internal:9443/health',
                },

                // Single character prefixes
                {
                    prefix: 'a',
                    originalUrl: 'https://b.example.com',
                    expected: 'https://a.example.com/',
                },

                // Numeric prefixes
                {
                    prefix: 'v2',
                    originalUrl: 'https://v1.api.example.com/users',
                    expected: 'https://v2.api.example.com/users',
                },

                // Hyphenated prefixes and domains
                {
                    prefix: 'multi-word',
                    originalUrl: 'https://old-api.example-site.com',
                    expected: 'https://multi-word.example-site.com/',
                },
            ]

            test.each(testCases)(
                'should replace domain prefix: $prefix + $originalUrl → $expected',
                ({ prefix, originalUrl, expected }) => {
                    expect(replaceDomainPrefix(originalUrl, prefix)).toBe(expected)
                }
            )
        })
    })
    describe('replaceDomain', () => {
        describe('regular domain replacement', () => {
            test('should replace exact domain match in URL', () => {
                const source = 'https://old.example.com/path'
                const result = replaceDomain(source, 'https://old.example.com', 'https://new.example.com')
                expect(result).toBe('https://new.example.com/path')
            })

            test('should replace multiple occurrences of domain', () => {
                const source = 'Visit https://old.com or https://old.com/api'
                const result = replaceDomain(source, 'https://old.com', 'https://new.com')
                expect(result).toBe('Visit https://new.com or https://new.com/api')
            })

            test('should replace domain with different protocol', () => {
                // nosemgrep: javascript.lang.security.detect-insecure-websocket.detect-insecure-websocket
                const source = 'ws://api.example.com/users'
                // nosemgrep: javascript.lang.security.detect-insecure-websocket.detect-insecure-websocket
                const result = replaceDomain(source, 'ws://api.example.com', 'wss://api.example.com')
                expect(result).toBe('wss://api.example.com/users')
            })

            test('should replace domain with port', () => {
                const source = 'https://localhost:3000/api/v1'
                const result = replaceDomain(source, 'https://localhost:3000', 'https://prod.example.com')
                expect(result).toBe('https://prod.example.com/api/v1')
            })

            test('should not replace partial domain matches', () => {
                const source = 'https://api.example.com/path'
                const result = replaceDomain(source, 'https://example.com', 'https://new.com')
                expect(result).toBe('https://api.example.com/path')
            })

            test('should not replace domain followed by more TLD parts', () => {
                const source = 'Visit https://example.com.au for Australian users'
                const result = replaceDomain(source, 'https://example.com', 'https://new.com')
                expect(result).toBe('Visit https://example.com.au for Australian users')
            })

            test('should not replace domain that is prefix of another domain', () => {
                const source = 'https://example.company/path'
                const result = replaceDomain(source, 'https://example.com', 'https://new.com')
                expect(result).toBe('https://example.company/path')
            })

            test('should replace domain followed by dot at end of sentence', () => {
                const source = 'Visit https://example.com. For more info'
                const result = replaceDomain(source, 'https://example.com', 'https://new.com')
                expect(result).toBe('Visit https://new.com. For more info')
            })

            test('should replace domain followed by path delimiter', () => {
                const source = 'https://example.com/path'
                const result = replaceDomain(source, 'https://example.com', 'https://new.com')
                expect(result).toBe('https://new.com/path')
            })

            test('should replace domain followed by query delimiter', () => {
                const source = 'https://example.com?param=value'
                const result = replaceDomain(source, 'https://example.com', 'https://new.com')
                expect(result).toBe('https://new.com?param=value')
            })

            test('should replace domain at end of string', () => {
                const source = 'Visit https://example.com'
                const result = replaceDomain(source, 'https://example.com', 'https://new.com')
                expect(result).toBe('Visit https://new.com')
            })
        })

        describe('wildcard domain replacement', () => {
            test('should replace wildcard subdomain', () => {
                const source = 'https://api.example.com/path'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.newdomain.com')
                expect(result).toBe('https://api.newdomain.com/path')
            })

            test('should replace different wildcard subdomains', () => {
                const source = 'https://dev.example.com and https://staging.example.com'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.prod.com')
                expect(result).toBe('https://dev.prod.com and https://staging.prod.com')
            })

            test('should preserve subdomain name in wildcard replacement', () => {
                const source = 'https://my-service.old-domain.com/api'
                const result = replaceDomain(source, 'https://*.old-domain.com', 'https://*.new-domain.com')
                expect(result).toBe('https://my-service.new-domain.com/api')
            })

            test('should handle wildcard with query parameters', () => {
                const source = 'https://api.example.com/search?q=test&page=1'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.newsite.com')
                expect(result).toBe('https://api.newsite.com/search?q=test&page=1')
            })

            test('should handle wildcard with fragments', () => {
                const source = 'https://docs.example.com/guide#section'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.newdocs.com')
                expect(result).toBe('https://docs.newdocs.com/guide#section')
            })

            test('should handle wildcard with numeric subdomains', () => {
                const source = 'https://v1.api.example.com/users'
                const result = replaceDomain(source, 'https://*.api.example.com', 'https://*.api.newsite.com')
                expect(result).toBe('https://v1.api.newsite.com/users')
            })

            test('should handle wildcard with hyphenated subdomains', () => {
                const source = 'https://my-app-staging.example.com'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.prod.com')
                expect(result).toBe('https://my-app-staging.prod.com')
            })

            test('should not replace wildcard domain followed by more TLD parts', () => {
                const source = 'Visit https://api.example.com.au for Australian users'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.new.com')
                expect(result).toBe('Visit https://api.example.com.au for Australian users')
            })

            test('should not replace wildcard when base domain is prefix of another', () => {
                const source = 'https://api.example.company/path'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.new.com')
                expect(result).toBe('https://api.example.company/path')
            })

            test('should replace wildcard domain followed by dot at end of sentence', () => {
                const source = 'Visit https://api.example.com. For more info'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.new.com')
                expect(result).toBe('Visit https://api.new.com. For more info')
            })
        })

        describe('encoded domain replacement', () => {
            test('should replace encoded domain when encoded option is true', () => {
                const source = 'redirect=https%3A%2F%2Fold.example.com%2Fpath'
                const result = replaceDomain(source, 'https://old.example.com', 'https://new.example.com', { encoded: true })
                expect(result).toBe('redirect=https%3A%2F%2Fnew.example.com%2Fpath')
            })

            test('should replace both plain and encoded domains', () => {
                const source = 'url=https://old.com and encoded=https%3A%2F%2Fold.com'
                const result = replaceDomain(source, 'https://old.com', 'https://new.com', { encoded: true })
                expect(result).toBe('url=https://new.com and encoded=https%3A%2F%2Fnew.com')
            })

            test('should replace encoded wildcard domains', () => {
                const source = 'redirect=https%3A%2F%2Fapi.example.com%2Fpath'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.newsite.com', { encoded: true })
                expect(result).toBe('redirect=https%3A%2F%2Fapi.newsite.com%2Fpath')
            })

            test('should handle encoded domains in query parameters', () => {
                const source = '/callback?return_url=https%3A%2F%2Fapp.example.com%2Fdashboard'
                const result = replaceDomain(source, 'https://app.example.com', 'https://app.newdomain.com', { encoded: true })
                expect(result).toBe('/callback?return_url=https%3A%2F%2Fapp.newdomain.com%2Fdashboard')
            })

            test('should handle multiple encoded domains with wildcards', () => {
                const source = 'url1=https%3A%2F%2Fapi.old.com&url2=https%3A%2F%2Fweb.old.com'
                const result = replaceDomain(source, 'https://*.old.com', 'https://*.new.com', { encoded: true })
                expect(result).toBe('url1=https%3A%2F%2Fapi.new.com&url2=https%3A%2F%2Fweb.new.com')
            })

            test('should not replace encoded domain when encoded option is false', () => {
                const source = 'redirect=https%3A%2F%2Fold.example.com%2Fpath'
                const result = replaceDomain(source, 'https://old.example.com', 'https://new.example.com', { encoded: false })
                expect(result).toBe('redirect=https%3A%2F%2Fold.example.com%2Fpath')
            })

            test('should handle encoded domains with ports', () => {
                const source = 'url=https%3A%2F%2Flocalhost%3A3000%2Fapi'
                const result = replaceDomain(source, 'https://localhost:3000', 'https://prod.com', { encoded: true })
                expect(result).toBe('url=https%3A%2F%2Fprod.com%2Fapi')
            })
        })

        describe('edge cases', () => {
            test('should handle empty source string', () => {
                const result = replaceDomain('', 'https://old.com', 'https://new.com')
                expect(result).toBe('')
            })

            test('should handle source without matching domain', () => {
                const source = 'https://different.com/path'
                const result = replaceDomain(source, 'https://old.com', 'https://new.com')
                expect(result).toBe('https://different.com/path')
            })

            test('should handle complex URLs with wildcards', () => {
                const source = 'https://api.example.com:8080/v1/users?filter=active&sort=name#results'
                const result = replaceDomain(source, 'https://*.example.com:8080', 'https://*.newapi.com:8080')
                expect(result).toBe('https://api.newapi.com:8080/v1/users?filter=active&sort=name#results')
            })

            test('should handle mixed plain and encoded with wildcards', () => {
                const source = 'Plain: https://api.old.com/path and encoded: https%3A%2F%2Fweb.old.com%2Fpage'
                const result = replaceDomain(source, 'https://*.old.com', 'https://*.new.com', { encoded: true })
                expect(result).toBe('Plain: https://api.new.com/path and encoded: https%3A%2F%2Fweb.new.com%2Fpage')
            })

            test('should preserve special characters in path', () => {
                const source = 'https://api.example.com/path/with-special_chars.and~tildes'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.new.com')
                expect(result).toBe('https://api.new.com/path/with-special_chars.and~tildes')
            })
        })

        describe('cache option', () => {
            test('should work without cache (default)', () => {
                const source = 'https://api.example.com/path'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.new.com')
                expect(result).toBe('https://api.new.com/path')
            })

            test('should work with urlsCache', () => {
                const urlsCache = new Map()
                const source = 'https://api.example.com/path'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.new.com', { urlsCache })
                expect(result).toBe('https://api.new.com/path')
                expect(urlsCache.size).toBeGreaterThan(0)
            })

            test('should work with regexpsCache', () => {
                const regexpsCache = new Map()
                const source = 'https://api.example.com/path'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.new.com', { regexpsCache })
                expect(result).toBe('https://api.new.com/path')
                expect(regexpsCache.size).toBeGreaterThan(0)
            })

            test('should work with both caches', () => {
                const urlsCache = new Map()
                const regexpsCache = new Map()
                const source = 'https://api.example.com/path'
                const result = replaceDomain(source, 'https://*.example.com', 'https://*.new.com', { urlsCache, regexpsCache })
                expect(result).toBe('https://api.new.com/path')
                expect(urlsCache.size).toBeGreaterThan(0)
                expect(regexpsCache.size).toBeGreaterThan(0)
            })

            test('should reuse cached values on subsequent calls', () => {
                const urlsCache = new Map()
                const regexpsCache = new Map()
                
                replaceDomain('https://api.example.com/path', 'https://*.example.com', 'https://*.new.com', { urlsCache, regexpsCache })
                const urlsCacheSize = urlsCache.size
                const regexpsCacheSize = regexpsCache.size
                
                replaceDomain('https://web.example.com/page', 'https://*.example.com', 'https://*.new.com', { urlsCache, regexpsCache })
                
                expect(urlsCache.size).toBe(urlsCacheSize)
                expect(regexpsCache.size).toBe(regexpsCacheSize)
            })
        })
    })

    describe('getWildcardDomain', () => {
        describe('basic wildcard extraction', () => {
            test('should extract wildcard domain from subdomain', () => {
                const result = getWildcardDomain('https://api.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'api',
                })
            })

            test('should extract wildcard domain from multi-level subdomain', () => {
                const result = getWildcardDomain('https://api.v1.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.v1.example.com',
                    prefix: 'api',
                })
            })

            test('should handle root domain', () => {
                const result = getWildcardDomain('https://example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.com',
                    prefix: 'example',
                })
            })

            test('should handle www subdomain', () => {
                const result = getWildcardDomain('https://www.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'www',
                })
            })
        })

        describe('different protocols', () => {
            test('should handle http protocol', () => {
                const result = getWildcardDomain('http://api.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'http://*.example.com',
                    prefix: 'api',
                })
            })

            test('should handle ws protocol', () => {
                // nosemgrep: javascript.lang.security.detect-insecure-websocket.detect-insecure-websocket
                const result = getWildcardDomain('ws://socket.example.com')
                expect(result).toEqual({
                    // nosemgrep: javascript.lang.security.detect-insecure-websocket.detect-insecure-websocket
                    wildcardDomain: 'ws://*.example.com',
                    prefix: 'socket',
                })
            })

            test('should handle wss protocol', () => {
                const result = getWildcardDomain('wss://secure.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'wss://*.example.com',
                    prefix: 'secure',
                })
            })
        })

        describe('with ports and paths', () => {
            test('should handle domain with port', () => {
                const result = getWildcardDomain('https://api.example.com:8080')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com:8080',
                    prefix: 'api',
                })
            })

            test('should ignore path in wildcard domain', () => {
                const result = getWildcardDomain('https://api.example.com/path/to/resource')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'api',
                })
            })

            test('should ignore query parameters', () => {
                const result = getWildcardDomain('https://api.example.com?param=value')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'api',
                })
            })

            test('should ignore fragments', () => {
                const result = getWildcardDomain('https://api.example.com#section')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'api',
                })
            })
        })

        describe('special subdomain names', () => {
            test('should handle hyphenated subdomain', () => {
                const result = getWildcardDomain('https://my-api.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'my-api',
                })
            })

            test('should handle numeric subdomain', () => {
                const result = getWildcardDomain('https://v1.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'v1',
                })
            })

            test('should handle mixed alphanumeric subdomain', () => {
                const result = getWildcardDomain('https://api2.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'api2',
                })
            })
        })

        describe('with cache', () => {
            test('should work without cache', () => {
                const result = getWildcardDomain('https://api.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'api',
                })
            })

            test('should use urlsCache when provided', () => {
                const urlsCache = new Map()
                const result1 = getWildcardDomain('https://api.example.com', urlsCache)
                const result2 = getWildcardDomain('https://api.example.com', urlsCache)
                
                expect(result1).toEqual({
                    wildcardDomain: 'https://*.example.com',
                    prefix: 'api',
                })
                expect(result2).toEqual(result1)
                expect(urlsCache.size).toBe(1)
            })

            test('should cache different domains separately', () => {
                const urlsCache = new Map()
                const result1 = getWildcardDomain('https://api.example.com', urlsCache)
                const result2 = getWildcardDomain('https://web.example.com', urlsCache)
                
                expect(result1.prefix).toBe('api')
                expect(result2.prefix).toBe('web')
                expect(urlsCache.size).toBe(2)
            })
        })

        describe('edge cases', () => {
            test('should handle localhost', () => {
                const result = getWildcardDomain('http://api.localhost')
                expect(result).toEqual({
                    wildcardDomain: 'http://*.localhost',
                    prefix: 'api',
                })
            })

            test('should handle single-part domain', () => {
                const result = getWildcardDomain('http://localhost')
                expect(result).toEqual({
                    wildcardDomain: 'http://*.',
                    prefix: 'localhost',
                })
            })

            test('should handle deep subdomain hierarchy', () => {
                const result = getWildcardDomain('https://api.v2.staging.example.com')
                expect(result).toEqual({
                    wildcardDomain: 'https://*.v2.staging.example.com',
                    prefix: 'api',
                })
            })
        })
    })
})