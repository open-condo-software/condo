const crypto = require('crypto')

const {
    CHANNEL_DEFINITIONS,
    RELAY_UNSUBSCRIBE_PREFIX,
} = require('../../core/topic')

/**
 * Supported JWT signing algorithms.
 * Each algorithm provides a header and sign function.
 */
const JWT_ALGORITHMS = {
    'ed25519-nkey': {
        header: { typ: 'JWT', alg: 'ed25519-nkey' },
        sign: (input, signingConfig) => {
            if (!signingConfig.keyPair) {
                throw new Error('ed25519-nkey algorithm requires keyPair in signingConfig')
            }
            return signingConfig.keyPair.sign(Buffer.from(input))
        },
    },
}

function base64url (data) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
    return buf.toString('base64url')
}

function base64urlDecode (str) {
    return Buffer.from(str, 'base64url')
}

function randomJti () {
    return crypto.randomBytes(16).toString('hex')
}

/**
 * Creates a NATS JWT signed with the specified algorithm.
 * @param {Object} claims - JWT claims payload
 * @param {Object} signingConfig - Algorithm-specific signing configuration
 * @param {string} [signingConfig.algorithm='ed25519-nkey'] - Algorithm name
 * @param {Object} [signingConfig.keyPair] - NKey key pair (for ed25519-nkey)
 * @returns {string} Encoded NATS JWT (header.payload.signature)
 */
function encodeNatsJwt (claims, signingConfig) {
    const algorithmName = signingConfig.algorithm || 'ed25519-nkey'
    const algo = JWT_ALGORITHMS[algorithmName]
    if (!algo) {
        throw new Error(`Unsupported JWT algorithm: ${algorithmName}`)
    }

    const headerB64 = base64url(JSON.stringify(algo.header))
    const payloadB64 = base64url(JSON.stringify(claims))
    const sigInput = `${headerB64}.${payloadB64}`
    const signature = algo.sign(sigInput, signingConfig)
    const sigB64 = base64url(signature)
    return `${headerB64}.${payloadB64}.${sigB64}`
}

/**
 * Decodes a NATS JWT payload without signature verification.
 * @param {string} token - Encoded NATS JWT
 * @returns {Object} Decoded claims
 */
function decodeNatsJwt (token) {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid NATS JWT format')
    return JSON.parse(base64urlDecode(parts[1]).toString())
}

/**
 * Creates a NATS user claims JWT for auth callout.
 * @param {Object} params
 * @param {string} params.userNkey - User public NKey from the auth request
 * @param {string} params.accountPublicKey - Account public key (issuer)
 * @param {Object} params.permissions - { pub: { allow: [] }, sub: { allow: [] } }
 * @param {Object} params.signingConfig - Signing configuration (algorithm + keyPair)
 * @param {string} [params.accountName] - Account name for non-operator mode (e.g. 'APP')
 * @param {number} [params.ttl] - Token TTL in seconds (adds exp claim)
 * @returns {string} Encoded user JWT
 */
function createUserJwt ({ userNkey, accountPublicKey, permissions, signingConfig, accountName, ttl }) {
    const now = Math.floor(Date.now() / 1000)
    const claims = {
        jti: randomJti(),
        iat: now,
        iss: accountPublicKey,
        sub: userNkey,
        nats: {
            pub: permissions.pub || { deny: ['>'] },
            sub: permissions.sub || { deny: ['>'] },
            subs: -1,
            data: -1,
            payload: -1,
            type: 'user',
            version: 2,
        },
    }
    if (ttl) {
        claims.exp = now + ttl
    }
    if (accountName) {
        claims.aud = accountName
    }
    return encodeNatsJwt(claims, signingConfig)
}

/**
 * Creates an authorization response JWT for NATS auth callout.
 * @param {Object} params
 * @param {string} params.userNkey - User public NKey from auth request
 * @param {string} params.serverId - Server ID from auth request
 * @param {string} params.accountPublicKey - Account public key (issuer)
 * @param {string} [params.userJwt] - Encoded user JWT (on success)
 * @param {string} [params.error] - Error message (on failure)
 * @param {Object} params.signingConfig - Signing configuration
 * @returns {string} Encoded authorization response JWT
 */
function createAuthResponseJwt ({ userNkey, serverId, accountPublicKey, userJwt, error, signingConfig }) {
    const claims = {
        jti: randomJti(),
        iat: Math.floor(Date.now() / 1000),
        iss: accountPublicKey,
        sub: userNkey,
        aud: serverId,
        nats: {
            type: 'authorization_response',
            version: 2,
        },
    }

    if (error) {
        claims.nats.error = error
    } else {
        claims.nats.jwt = userJwt
    }

    return encodeNatsJwt(claims, signingConfig)
}

/**
 * Computes pub/sub permissions for a user based on their userId and organizationId.
 *
 * Dynamically builds PUB allow patterns from CHANNEL_DEFINITIONS registry.
 * Each channel definition provides buildRelayPermissions({ userId, organizationId })
 * that returns the PUB patterns for relay subscribe topics.
 *
 * Also grants:
 *   - _MESSAGING.unsubscribe.*  (unsubscribe from relays)
 *   - _INBOX.>                  (receive relayed messages)
 *
 * @param {string} userId
 * @param {string} organizationId
 * @returns {{ pub: { allow: string[] }, sub: { allow: string[] } }}
 */
function computePermissions (userId, organizationId) {
    const context = { userId, organizationId }
    const channelPermissions = CHANNEL_DEFINITIONS.flatMap(ch => ch.buildRelayPermissions(context))

    const pubAllow = [
        '_INBOX.>',
        ...channelPermissions,
        `${RELAY_UNSUBSCRIBE_PREFIX}.*`,
    ]
    const subAllow = ['_INBOX.>']

    return {
        pub: { allow: pubAllow },
        sub: { allow: subAllow },
    }
}

/**
 * Register a custom JWT signing algorithm.
 * @param {string} name - Algorithm name
 * @param {Object} algo - Algorithm implementation
 * @param {Object} algo.header - JWT header object (must include typ and alg)
 * @param {Function} algo.sign - (input: string, signingConfig: Object) => Buffer
 */
function registerAlgorithm (name, algo) {
    if (!algo.header || !algo.sign) {
        throw new Error('Algorithm must provide header and sign function')
    }
    JWT_ALGORITHMS[name] = algo
}

module.exports = {
    encodeNatsJwt,
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
    registerAlgorithm,
    base64url,
    base64urlDecode,
    JWT_ALGORITHMS,
}
