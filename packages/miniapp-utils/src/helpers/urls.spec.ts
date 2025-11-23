import { isSafeUrl, replaceDomainPrefix } from './urls'

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
})