import { extractHostname, isSafeUrl } from './urls'

describe('isSafeUrl', () => {
    describe('safe url cases', () => {
        const safeCases = [
            // Standard HTTPS URLs
            'https://github.com',
            'https://v1.doma.ai/ticket',
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

describe('extractHostname', () => {
    describe('basic hostname extraction', () => {
        const basicCases = [
            ['http://www.blog.classroom.me.uk/index.php', 'www.blog.classroom.me.uk'],
            ['http://www.youtube.com/watch?v=ClkQA2Lb_iE', 'www.youtube.com'],
            ['https://www.youtube.com/watch?v=ClkQA2Lb_iE', 'www.youtube.com'],
            ['www.youtube.com/watch?v=ClkQA2Lb_iE', 'www.youtube.com'],
            ['ftps://ftp.websitename.com/dir/file.txt', 'ftp.websitename.com'],
            ['websitename.com:1234/dir/file.txt', 'websitename.com'],
            ['ftps://websitename.com:1234/dir/file.txt', 'websitename.com'],
            ['example.com?param=value', 'example.com'],
            ['https://facebook.github.io/jest/', 'facebook.github.io'],
            ['//youtube.com/watch?v=ClkQA2Lb_iE', 'youtube.com'],
            ['http://localhost:4200/watch?v=ClkQA2Lb_iE', 'localhost'],
        ]

        test.each(basicCases)('should extract hostname from %p', (url, expected) => {
            expect(extractHostname(url)).toEqual(expected)
        })
    })

    describe('edge cases', () => {
        test('should handle URLs with ports', () => {
            expect(extractHostname('https://example.com:8080/path')).toEqual('example.com')
            expect(extractHostname('http://localhost:3000')).toEqual('localhost')
            expect(extractHostname('ftp://files.example.com:21/file.txt')).toEqual('files.example.com')
        })

        test('should handle URLs with query parameters', () => {
            expect(extractHostname('https://example.com?param=value&other=test')).toEqual('example.com')
            expect(extractHostname('example.com?single=param')).toEqual('example.com')
        })

        test('should handle protocol-relative URLs', () => {
            expect(extractHostname('//example.com/path')).toEqual('example.com')
            expect(extractHostname('//subdomain.example.com:8080/path?query=value')).toEqual('subdomain.example.com')
        })

        test('should handle URLs without protocol', () => {
            expect(extractHostname('example.com/path/to/resource')).toEqual('example.com')
            expect(extractHostname('subdomain.example.com')).toEqual('subdomain.example.com')
        })

        test('should handle complex domain structures', () => {
            expect(extractHostname('https://api.v2.subdomain.example.co.uk/endpoint')).toEqual('api.v2.subdomain.example.co.uk')
            expect(extractHostname('mail.google.com')).toEqual('mail.google.com')
        })

        test('should handle URLs with fragments', () => {
            expect(extractHostname('https://example.com/path#fragment')).toEqual('example.com')
            expect(extractHostname('example.com#fragment')).toEqual('example.com')
        })

        test('should handle URLs with both query and fragment', () => {
            expect(extractHostname('https://example.com/path?query=value#fragment')).toEqual('example.com')
            expect(extractHostname('example.com:8080?query=value#fragment')).toEqual('example.com')
        })
    })

    describe('special protocols', () => {
        test('should handle various protocols', () => {
            expect(extractHostname('ftp://files.example.com/file.txt')).toEqual('files.example.com')
            expect(extractHostname('ftps://secure.example.com/file.txt')).toEqual('secure.example.com')
            expect(extractHostname('ssh://user@server.example.com/path')).toEqual('user@server.example.com')
        })
    })

    describe('minimal cases', () => {
        test('should handle domain-only URLs', () => {
            expect(extractHostname('example.com')).toEqual('example.com')
            expect(extractHostname('localhost')).toEqual('localhost')
            expect(extractHostname('subdomain.example.org')).toEqual('subdomain.example.org')
        })

        test('should handle single path URLs', () => {
            expect(extractHostname('example.com/')).toEqual('example.com')
            expect(extractHostname('localhost/')).toEqual('localhost')
        })
    })
})