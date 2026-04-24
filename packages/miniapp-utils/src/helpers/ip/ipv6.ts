import ipRanges from './ranges'
import * as util from './utils'

// Note: Profiling shows that on recent versions of Node, string.split(RegExp) is faster
// than string.split(string).
const dot = /\./
const mappedIpv4 = /^(.+:ffff:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:%.+)?$/
const colon = /:/
const doubleColon = /::/

/**
 * Given a mapped IPv4 address (e.g. ::ffff:203.0.113.38 or similar), convert it to the
 * equivalent standard IPv6 address.
 * @param ip the IPv4-to-IPv6 mapped address
 */
function mappedIpv4ToIpv6 (ip: string) {
    const matches = ip.match(mappedIpv4)

    if (!matches || !util.isIPv4(matches[2])) {
        throw new Error(`not a mapped IPv4 address: ${ip}`)
    }

    // mapped IPv4 address
    const prefix = matches[1]
    const ipv4 = matches[2]

    const parts = ipv4.split(dot).map(x => parseInt(x, 10))

    const segment7 = ((parts[0] << 8) + parts[1]).toString(16)
    const segment8 = ((parts[2] << 8) + parts[3]).toString(16)

    return `${prefix}${segment7}:${segment8}`
}

/**
 * Given a mapped IPv4 address, return the bare IPv4 equivalent.
 */
export function extractMappedIpv4 (ip: string) {
    const matches = ip.match(mappedIpv4)

    if (!matches || !util.isIPv4(matches[2])) {
        throw new Error(`not a mapped IPv4 address: ${ip}`)
    }

    return matches[2]
}

/**
 * Given an IP address that may have double-colons, expand all segments and return them
 * as an array of 8 segments (16-bit words). As a peformance enhancement (indicated by
 * profiling), for any segment that was missing but should be a '0', returns undefined.
 * @param ip the IPv6 address to expand
 * @throws if the string is not a valid IPv6 address
 */
function getIpv6Segments (ip: string): string[] {
    if (!util.isIPv6(ip)) {
        throw new Error(`not a valid IPv6 address: ${ip}`)
    }

    if (dot.test(ip)) {
        return getIpv6Segments(mappedIpv4ToIpv6(ip))
    }

    // break it into an array, including missing "::" segments
    const [beforeChunk, afterChunk] = ip.split(doubleColon)

    const beforeParts = (beforeChunk && beforeChunk.split(colon)) || []
    const afterParts = (afterChunk && afterChunk.split(colon)) || []
    const missingSegments = new Array<string>(8 - (beforeParts.length + afterParts.length))

    return beforeParts.concat(missingSegments, afterParts)
}

/**
 * Test if the given IPv6 address is contained in the specified subnet.
 * @param address the IPv6 address to check
 * @param subnetOrSubnets the IPv6 CIDR to test (or an array of them)
 * @throws if the address or subnet are not valid IP addresses, or the CIDR prefix length
 *  is not valid
 */
export function isInSubnet (address: string, subnetOrSubnets: string | string[]): boolean {
    return createChecker(subnetOrSubnets)(address)
}

/**
 * Create a function to test if a given IPv6 address is contained in the specified subnet.
 * @param subnetOrSubnets the IPv6 CIDR to test (or an array of them)
 * @throws if the subnet(s) are not valid IP addresses, or the CIDR prefix lengths
 *  are not valid
 */
export function createChecker (
    subnetOrSubnets: string | string[]
): (address: string) => boolean {
    if (Array.isArray(subnetOrSubnets)) {
        const checks = subnetOrSubnets.map(subnet => createSegmentChecker(subnet))
        return address => {
            const segments = getIpv6Segments(address)
            return checks.some(check => check(segments))
        }
    }
    const check = createSegmentChecker(subnetOrSubnets)
    return address => {
        const segments = getIpv6Segments(address)
        return check(segments)
    }
}

// This creates the last function that works on the most deconstructed data
function createSegmentChecker (subnet: string): (segments: string[]) => boolean {
    const [subnetAddress, prefixLengthString] = subnet.split('/')
    const prefixLength = parseInt(prefixLengthString, 10)

    if (!subnetAddress || !Number.isInteger(prefixLength)) {
        throw new Error(`not a valid IPv6 CIDR subnet: ${subnet}`)
    }

    if (prefixLength < 0 || prefixLength > 128) {
        throw new Error(`not a valid IPv6 prefix length: ${prefixLength} (from ${subnet})`)
    }

    // the next line throws if the address is not a valid IPv6 address
    const subnetSegments = getIpv6Segments(subnetAddress)

    return addressSegments => {
        for (let i = 0; i < 8; ++i) {
            const bitCount = Math.min(prefixLength - i * 16, 16)

            if (bitCount <= 0) {
                break
            }

            const subnetPrefix =
                ((subnetSegments[i] && parseInt(subnetSegments[i], 16)) || 0) >> (16 - bitCount)

            const addressPrefix =
                ((addressSegments[i] && parseInt(addressSegments[i], 16)) || 0) >>
                (16 - bitCount)

            if (subnetPrefix !== addressPrefix) {
                return false
            }
        }

        return true
    }
}

// cache these special subnet checkers
const specialNetsCache: Record<string, (address: string) => boolean> = {}

/** Test if the given IP address is a private/internal IP address. */
export function isPrivate (address: string) {
    if (!('private' in specialNetsCache)) {
        specialNetsCache['private'] = createChecker(ipRanges.private.ipv6)
    }
    return specialNetsCache['private'](address)
}

/** Test if the given IP address is a localhost address. */
export function isLocalhost (address: string) {
    if (!('localhost' in specialNetsCache)) {
        specialNetsCache['localhost'] = createChecker(ipRanges.localhost.ipv6)
    }
    return specialNetsCache['localhost'](address)
}

/** Test if the given IP address is an IPv4 address mapped onto IPv6 */
export function isIPv4MappedAddress (address: string) {
    if (!('mapped' in specialNetsCache)) {
        specialNetsCache['mapped'] = createChecker('::ffff:0:0/96')
    }
    if (specialNetsCache['mapped'](address)) {
        const matches = address.match(mappedIpv4)
        return Boolean(matches && util.isIPv4(matches[2]))
    }
    return false
}

/** Test if the given IP address is in a known reserved range and not a normal host IP */
export function isReserved (address: string) {
    if (!('reserved' in specialNetsCache)) {
        specialNetsCache['reserved'] = createChecker(ipRanges.reserved.ipv6)
    }
    return specialNetsCache['reserved'](address)
}

/**
 * Test if the given IP address is a special address of any kind (private, reserved,
 * localhost)
 */
export function isSpecial (address: string) {
    if (!('special' in specialNetsCache)) {
        specialNetsCache['special'] = createChecker([
            ...ipRanges.private.ipv6,
            ...ipRanges.localhost.ipv6,
            ...ipRanges.reserved.ipv6,
        ])
    }
    return specialNetsCache['special'](address)
}