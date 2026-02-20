const crypto = require('crypto')

const { buildRelaySubscribeSubject, buildRelayUnsubscribePattern } = require('../subject')

const NATS_JWT_HEADER = { typ: 'JWT', alg: 'ed25519-nkey' }

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
 * Creates a NATS JWT signed with an NKey
 * @param {Object} claims - JWT claims payload
 * @param {Object} accountKeyPair - nkeys.js key pair used for signing
 * @returns {string} Encoded NATS JWT (header.payload.signature)
 */
function encodeNatsJwt (claims, accountKeyPair) {
    const headerB64 = base64url(JSON.stringify(NATS_JWT_HEADER))
    const payloadB64 = base64url(JSON.stringify(claims))
    const sigInput = `${headerB64}.${payloadB64}`
    const signature = accountKeyPair.sign(Buffer.from(sigInput))
    const sigB64 = base64url(signature)
    return `${headerB64}.${payloadB64}.${sigB64}`
}

/**
 * Decodes a NATS JWT payload without signature verification
 * @param {string} token - Encoded NATS JWT
 * @returns {Object} Decoded claims
 */
function decodeNatsJwt (token) {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid NATS JWT format')
    return JSON.parse(base64urlDecode(parts[1]).toString())
}

/**
 * Creates a NATS user claims JWT for auth callout
 * @param {Object} params
 * @param {string} params.userNkey - User public NKey from the auth request
 * @param {string} params.accountPublicKey - Account public key (issuer)
 * @param {Object} params.permissions - { pub: { allow: [] }, sub: { allow: [] } }
 * @param {Object} params.accountKeyPair - nkeys.js key pair for signing
 * @param {string} [params.accountName] - Account name for non-operator mode (e.g. 'APP')
 * @returns {string} Encoded user JWT
 */
function createUserJwt ({ userNkey, accountPublicKey, permissions, accountKeyPair, accountName }) {
    const claims = {
        jti: randomJti(),
        iat: Math.floor(Date.now() / 1000),
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
    if (accountName) {
        claims.aud = accountName
    }
    return encodeNatsJwt(claims, accountKeyPair)
}

/**
 * Creates an authorization response JWT for NATS auth callout
 * @param {Object} params
 * @param {string} params.userNkey - User public NKey from auth request
 * @param {string} params.serverId - Server ID from auth request
 * @param {string} params.accountPublicKey - Account public key (issuer)
 * @param {string} [params.userJwt] - Encoded user JWT (on success)
 * @param {string} [params.error] - Error message (on failure)
 * @param {Object} params.accountKeyPair - nkeys.js key pair for signing
 * @returns {string} Encoded authorization response JWT
 */
function createAuthResponseJwt ({ userNkey, serverId, accountPublicKey, userJwt, error, accountKeyPair }) {
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

    return encodeNatsJwt(claims, accountKeyPair)
}

/**
 * Computes NATS pub/sub permissions for a user based on their allowed streams
 * @param {string[]} allowedStreams - Stream names the user can access
 * @param {string} organizationId - Organization ID for scoping subjects
 * @returns {{ pub: { allow: string[] }, sub: { allow: string[] } }}
 */
function computePermissions (allowedStreams, organizationId) {
    const pubAllow = ['_INBOX.>']
    const subAllow = ['_INBOX.>']

    for (const streamName of allowedStreams) {
        pubAllow.push(buildRelaySubscribeSubject(streamName, organizationId))
        pubAllow.push(buildRelayUnsubscribePattern())
    }

    return {
        pub: { allow: pubAllow },
        sub: { allow: subAllow },
    }
}

module.exports = {
    encodeNatsJwt,
    decodeNatsJwt,
    createUserJwt,
    createAuthResponseJwt,
    computePermissions,
    base64url,
    base64urlDecode,
}
