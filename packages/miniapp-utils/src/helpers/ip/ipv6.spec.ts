
import ipv6fixtures from './_fixtures/ipv6'
import * as IPv6 from './ipv6'

describe('IPv6 tests', () => {
    it('should check ipv6 subnet membership (one-at-a-time)', () => {
        ipv6fixtures.forEach(([ip, subnet, expected]) => {
            expect(IPv6.isInSubnet(ip, subnet)).toBe(expected)
        })
    })

    it('should check ipv6 subnet membership (array)', () => {
        const uniqueIps = new Set<string>(ipv6fixtures.map(f => f[0]))

        uniqueIps.forEach(ip => {
            const inSubnets = ipv6fixtures.filter(t => t[0] === ip && t[2]).map(t => t[1])
            if (inSubnets.length) {
                expect(IPv6.isInSubnet(ip, inSubnets)).toBe(true)
            }

            const notInSubnets = ipv6fixtures.filter(t => t[0] === ip && !t[2]).map(t => t[1])
            expect(IPv6.isInSubnet(ip, notInSubnets)).toBe(false)
        })
    })

    it('should handle an empty subnet array', () => {
        const ip = ipv6fixtures[0][0]
        expect(IPv6.isInSubnet(ip, [])).toBe(false)
    })

    it('should throw on invalid subnets', () => {
        expect(() => IPv6.isInSubnet('2001:db8:f53a::1', '2001:db8:f53a::1')).toThrow()
        expect(() => IPv6.isInSubnet('2001:db8:f53a::1', '2001:db8:f53a::1/-1')).toThrow()
        expect(() => IPv6.isInSubnet('2001:db8:f53a::1', '2001:db8:f53a::1/129')).toThrow()
    })

    it('should throw on invalid ipv6', () => {
        expect(() => IPv6.isInSubnet('10.5.0.1', '2001:db8:f53a::1:1/64')).toThrow()
        expect(() => IPv6.isInSubnet('::ffff:22.33', '2001:db8:f53a::1:1/64')).toThrow()
        expect(() => IPv6.isInSubnet('::ffff:192.168.0.256', '2001:db8:f53a::1:1/64')).toThrow()
    })

    it('should handle ipv6 localhost', () => {
        expect(IPv6.isLocalhost('::1')).toBe(true)
        expect(IPv6.isLocalhost('::2')).toBe(false)
    })

    it('should handle ipv6 private', () => {
        expect(IPv6.isPrivate('::1')).toBe(false)
        expect(IPv6.isPrivate('fe80::5555:1111:2222:7777%utun2')).toBe(true)
        expect(IPv6.isPrivate('fdc5:3c04:80bf:d9ee::1')).toBe(true)
    })

    it('should handle ipv6 mapped', () => {
        expect(IPv6.isIPv4MappedAddress('::1')).toBe(false)
        expect(
            IPv6.isIPv4MappedAddress('fe80::5555:1111:2222:7777%utun2')
        ).toBe(false)
        expect(IPv6.isIPv4MappedAddress('::ffff:192.168.0.1')).toBe(true)

        // THIS FORMAT IS DEPRECATED AND WE DO NOT SUPPORT IT: SEE RFC4291 SECTION 2.5.5.1
        // https://tools.ietf.org/html/rfc4291#section-2.5.5.1
        expect(() => IPv6.isIPv4MappedAddress('::192.168.0.1')).toThrow()
    })

    it('should handle ipv6 reserved', () => {
        expect(IPv6.isReserved('2001:db8:f53a::1')).toBe(true)
        expect(IPv6.isReserved('2001:4860:4860::8888')).toBe(false)
        expect(IPv6.isReserved('::')).toBe(true)
    })

    it('should handle ipv6 special', () => {
        expect(IPv6.isSpecial('2001:4860:4860::8888')).toBe(false)
        expect(IPv6.isSpecial('::1')).toBe(true)
        expect(IPv6.isSpecial('::ffff:192.168.0.1')).toBe(false)
        expect(IPv6.isSpecial('2001:db8:f53a::1')).toBe(true)
    })

    it('should extract mapped ipv4', () => {
        expect(IPv6.extractMappedIpv4('::ffff:127.0.0.1')).toBe('127.0.0.1')

        // bogus IP should throw
        expect(() => IPv6.extractMappedIpv4('::ffff:444.333.2.1')).toThrow()

        // invalid address format should throw
        expect(() => IPv6.extractMappedIpv4('::192.168.0.1')).toThrow()
    })
})