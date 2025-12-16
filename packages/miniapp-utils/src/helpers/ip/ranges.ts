export default {
    /** localhost IP ranges */
    localhost: {
        /** the localhost address ranges for IPv4 */
        ipv4: ['127.0.0.0/8'],

        /** the localhost address ranges for IPv6 */
        ipv6: ['::1/128'],
    },

    /** private IP ranges */
    private: {
        /** private address ranges for IPv4 */
        ipv4: [
            '10.0.0.0/8', // RFC 1918
            '172.16.0.0/12', // RFC 1918
            '192.168.0.0/16', // RFC 1918
        ],

        /** private address ranges for IPv6 */
        ipv6: [
            'fe80::/10', // link-local address
            'fc00::/7', // unique local address (ULA)
        ],
    },

    /** reserved IP ranges */
    reserved: {
        /** reserved address ranges for IPv4 */
        ipv4: [
            '0.0.0.0/8', // broadcast "this"
            '100.64.0.0/10', // carrier-grade NAT
            '169.254.0.0/16', // DHCP fallback
            '192.0.0.0/24', // IANA Special Purpose Address Registry
            '192.0.2.0/24', // TEST-NET-1 for documentation examples
            '192.88.99.0/24', // deprecated 6to4 anycast relays
            '198.18.0.0/15', // for testing inter-network comms between two subnets
            '198.51.100.0/24', // TEST-NET-2 for documentation examples
            '203.0.113.0/24', // TEST-NET-3 for documentation examples
            '224.0.0.0/4', // multicast
            '240.0.0.0/4', // reserved unspecified
            '255.255.255.255/32', // limited broadcast address
        ],

        /** reserved address ranges for IPv6 */
        ipv6: [
            '::/128', // unspecified address
            '64:ff9b::/96', // IPv4/IPv6 translation
            '100::/64', // discard prefix
            '2001::/32', // Teredo tunneling
            '2001:10::/28', // deprecated
            '2001:20::/28', // ORCHIDv2
            '2001:db8::/32', // for documentation and examples
            '2002::/16', // 6to4
            'ff00::/8', // multicast
        ],
    },
}