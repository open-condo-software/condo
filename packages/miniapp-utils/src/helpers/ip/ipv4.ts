import ipRanges from './ranges'
import * as util from './utils'

/**
 * Given an IPv4 address, convert it to a 32-bit long integer.
 * @param ip the IPv4 address to expand
 * @throws if the string is not a valid IPv4 address
 */
function ipv4ToLong (ip: string) {
    if (!util.isIPv4(ip)) {
        throw new Error(`not a valid IPv4 address: ${ip}`)
    }
    const octets = ip.split('.')
    return (
        ((parseInt(octets[0], 10) << 24) +
            (parseInt(octets[1], 10) << 16) +
            (parseInt(octets[2], 10) << 8) +
            parseInt(octets[3], 10)) >>>
        0
    )
}

// this is the most optimised checker.
function createLongChecker (subnet: string): (addressLong: number) => boolean {
    const [subnetAddress, prefixLengthString] = subnet.split('/')
    const prefixLength = parseInt(prefixLengthString, 10)
    if (!subnetAddress || !Number.isInteger(prefixLength)) {
        throw new Error(`not a valid IPv4 subnet: ${subnet}`)
    }

    if (prefixLength < 0 || prefixLength > 32) {
        throw new Error(`not a valid IPv4 prefix length: ${prefixLength} (from ${subnet})`)
    }

    const subnetLong = ipv4ToLong(subnetAddress)
    return addressLong => {
        if (prefixLength === 0) {
            return true
        }
        const subnetPrefix = subnetLong >> (32 - prefixLength)
        const addressPrefix = addressLong >> (32 - prefixLength)

        return subnetPrefix === addressPrefix
    }
}

/**
 * The functional version, creates a checking function that takes an IPv4 Address and
 * returns whether or not it is contained in (one of) the subnet(s).
 * @param subnetOrSubnets the IPv4 CIDR to test (or an array of them)
 * @throws if the subnet is not a valid IP addresses, or the CIDR prefix length
 *  is not valid
 */
export function createChecker (
    subnetOrSubnets: string | string[]
): (address: string) => boolean {
    if (Array.isArray(subnetOrSubnets)) {
        const checks = subnetOrSubnets.map(subnet => createLongChecker(subnet))
        return address => {
            const addressLong = ipv4ToLong(address)
            return checks.some(check => check(addressLong))
        }
    }
    const check = createLongChecker(subnetOrSubnets)
    return address => {
        const addressLong = ipv4ToLong(address)
        return check(addressLong)
    }
}

/**
 * Test if the given IPv4 address is contained in the specified subnet.
 * @param address the IPv4 address to check
 * @param subnetOrSubnets the IPv4 CIDR to test (or an array of them)
 * @throws if the address or subnet are not valid IP addresses, or the CIDR prefix length
 *  is not valid
 */
export function isInSubnet (address: string, subnetOrSubnets: string | string[]): boolean {
    return createChecker(subnetOrSubnets)(address)
}

// cache these special subnet checkers
const specialNetsCache: Record<string, (address: string) => boolean> = {}

/** Test if the given IP address is a private/internal IP address. */
export function isPrivate (address: string) {
    if (!('private' in specialNetsCache)) {
        specialNetsCache['private'] = createChecker(ipRanges.private.ipv4)
    }
    return specialNetsCache['private'](address)
}

/** Test if the given IP address is a localhost address. */
export function isLocalhost (address: string) {
    if (!('localhost' in specialNetsCache)) {
        specialNetsCache['localhost'] = createChecker(ipRanges.localhost.ipv4)
    }
    return specialNetsCache['localhost'](address)
}

/** Test if the given IP address is in a known reserved range and not a normal host IP */
export function isReserved (address: string) {
    if (!('reserved' in specialNetsCache)) {
        specialNetsCache['reserved'] = createChecker(ipRanges.reserved.ipv4)
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
            ...ipRanges.private.ipv4,
            ...ipRanges.localhost.ipv4,
            ...ipRanges.reserved.ipv4,
        ])
    }
    return specialNetsCache['special'](address)
}