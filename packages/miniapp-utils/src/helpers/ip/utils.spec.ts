import * as util from './utils'

describe('util', () => {
    describe('isIPv6', () => {
        const valid = [
            '0000:0000:0000:0000:0000:0000:0000:0000',
            '1050:0:0:0:5:600:300c:326b',
            '2001:252:0:1::2008:6',
            '2001::',
            '2001:dead::',
            '2001:dead:beef:1::',
            '2001:dead:beef:1::2008:6',
            '2001:dead:beef::',
            '::',
            '::1',
            '::2001:252:1:1.1.1.1',
            '::2001:252:1:2008:6',
            '::2001:252:1:255.255.255.255',
            'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
            '::192:168:0:1', // deprecated format but allowed by Node’s net.isIPv6
            '::ffff:127.0.0.1', // mapped IPv4
            { toString: () => '::2001:252:1:255.255.255.255' },
        ]

        const invalid = [
            '1200::AB00:1234::2552:7777:1313', // uses :: twice
            '1200:0000:AB00:1234:O000:2552:7777:1313', // contains an O instead of 0
            '1050:0:0:0:5:600:300g:326b', // g is an invalid hex digit
            '127.0.0.1',
            'example.com',
            '',
            null,
            123,
            true,
            {},
            { toString: () => '127.0.0.1' },
            { toString: () => 'bla' },
            '8.8.8.08', // IPv4, last segment is octal-like, should throw
            '0127.0.0.1', // IPv4, first segment is octal-like, should throw
            '::ffff:0127.0.0.1', // mapped IPv4, first segment is octal-like, should throw
        ]

        it('should recognize valid ipv6 addresses', () => {
            valid.forEach(ip => {
                // `as any` so we can test values convertible to string
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(util.isIPv6(ip as any)).toBe(true)
            })
        })

        it('should not recognize invalid ipv6 addresses', () => {
            invalid.forEach(ip => {
                // `as any` so we can test non-string values
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(util.isIPv6(ip as any)).toBe(false)
            })
        })

        it('should return false if no address is provided', () => {
            // `as any` so we can test non-string values
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((util.isIPv6 as any)()).toBe(false)
        })
    })

    describe('isIPv4', () => {
        const valid = [
            '0.0.0.0',
            '255.255.255.255',
            '192.168.1.100',
            '127.0.0.1',
            { toString: () => '127.0.0.1' },
        ]

        const invalid = [
            '2001:0db8:aaaa:0001::0200', // IPv6
            '192.168.256.1', // third octet out-of-range
            'example.com',
            '',
            null,
            123,
            true,
            {},
            { toString: () => '::2001:252:1:255.255.255.255' },
            { toString: () => 'bla' },
            '2001:252:0:1::2008:6',
            '8.8.8.08', // last segment is octal-like, should throw
            '0127.0.0.1', // first segment is octal-like, should throw
        ]

        it('should recognize valid ipv4 addresses', () => {
            valid.forEach(ip => {
                // `as any` so we can test values convertible to string
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(util.isIPv4(ip as any)).toBe(true)
            })
        })

        it('should not recognize invalid ipv4 addresses', () => {
            invalid.forEach(ip => {
                // `as any` so we can test non-string values
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(util.isIPv4(ip as any)).toBe(false)
            })
        })

        it('should return false if no address is provided', () => {
            // `as any` so we can test non-string values
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((util.isIPv4 as any)()).toBe(false)
        })
    })

    describe('isIP', () => {
        const valid: [string | { toString: () => string }, number][] = [
            ['127.0.0.1', 4],
            ['0000:0000:0000:0000:0000:0000:0000:0000', 6],
            ['1050:0:0:0:5:600:300c:326b', 6],
            ['2001:252:0:1::2008:6', 6],
            ['2001:dead:beef:1::2008:6', 6],
            ['2001::', 6],
            ['2001:dead::', 6],
            ['2001:dead:beef::', 6],
            ['2001:dead:beef:1::', 6],
            ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 6],
            ['::2001:252:1:2008:6', 6],
            ['::2001:252:1:1.1.1.1', 6],
            ['::2001:252:1:255.255.255.255', 6],
            ['::1', 6],
            ['::', 6],
            [{ toString: () => '::2001:252:1:255.255.255.255' }, 6],
            [{ toString: () => '127.0.0.1' }, 4],
        ]

        const invalid = [
            'x127.0.0.1',
            'example.com',
            '0000:0000:0000:0000:0000:0000:0000:0000::0000',
            ':2001:252:0:1::2008:6:',
            ':2001:252:0:1::2008:6',
            '2001:252:0:1::2008:6:',
            '2001:252::1::2008:6',
            '::2001:252:1:255.255.255.255.76',
            '::anything',
            '0000:0000:0000:0000:0000:0000:12345:0000',
            '0',
            '',
            null,
            123,
            true,
            {},
            { toString: () => 'bla' },
        ]

        it('should recognize valid addresses', () => {
            valid.forEach(([ip, version]) => {
                // `as any` so we can test values convertible to string
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(util.isIP(ip as any)).toBe(version)
            })
        })

        it('should not recognize invalid addresses', () => {
            invalid.forEach(ip => {
                // `as any` so we can test non-string values
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect(util.isIP(ip as any)).toBe(0)
            })
        })

        it('should return 0 if no address is provided', () => {
            // `as any` so we can test non-string values
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((util.isIP as any)()).toBe(0)
        })
    })
})