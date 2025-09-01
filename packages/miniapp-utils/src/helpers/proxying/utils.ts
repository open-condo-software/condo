import jwt from 'jsonwebtoken'
import proxyAddr from 'proxy-addr'
import { z } from 'zod'

import type { IncomingMessage } from 'http'

type ProxyConfig = {
    address: string | Array<string>
    secret: string
}

type ProxyId = string

export type KnownProxies = Record<ProxyId, ProxyConfig>

export type TrustProxyFunction = (proxyAddr: string, idx: number) => boolean

const _ipSchema = z.union([z.ipv4(), z.ipv6()])
const _timeStampBasicRegexp = /^\d+$/

const DEFAULT_PROXY_TIMEOUT_IN_MS = 5_000 // 5 sec to pass request is enough
const X_PROXY_ID_HEADER = 'x-proxy-id' as const
const X_PROXY_IP_HEADER = 'x-proxy-ip' as const
const X_PROXY_TIMESTAMP_HEADER = 'x-proxy-timestamp' as const
const X_PROXY_SIGNATURE_HEADER = 'x-proxy-signature' as const

export type ProxyHeaders = {
    [X_PROXY_ID_HEADER]: string
    [X_PROXY_IP_HEADER]: string
    [X_PROXY_TIMESTAMP_HEADER]: string
    [X_PROXY_SIGNATURE_HEADER]: string
}

function _getTimestampFromHeader (timestamp: string) {
    if (!_timeStampBasicRegexp.test(timestamp)) return Number.NaN
    return (new Date(parseInt(timestamp))).getTime()
}

export function getRequestIp (req: IncomingMessage, trustProxyFn: TrustProxyFunction, knownProxies?: KnownProxies): string {
    // NOTE: That's what express does under the hood: https://github.com/expressjs/express/blob/4.x/lib/request.js#L349
    const originalIP = proxyAddr(req, trustProxyFn)

    if (!knownProxies) return originalIP

    const xProxyId = req.headers[X_PROXY_ID_HEADER]
    const xProxyIp = req.headers[X_PROXY_IP_HEADER]
    // NOTE: used to prevent relay attacks
    const xProxyTimestamp = req.headers[X_PROXY_TIMESTAMP_HEADER]
    const xProxySignature = req.headers[X_PROXY_SIGNATURE_HEADER]

    if (
        typeof xProxyId !== 'string' ||
        typeof xProxyIp !== 'string' ||
        typeof xProxyTimestamp !== 'string' ||
        typeof xProxySignature !== 'string'
    ) {
        return originalIP
    }

    // NOTE: validate, that x-proxy-ip is correct IP
    const { success: isValidIp } = _ipSchema.safeParse(xProxyIp)
    if (!isValidIp) {
        return originalIP
    }

    // NOTE: validate timestamp: it should less than now and no more than 5s less than now (recent enough)
    const timestamp = _getTimestampFromHeader(xProxyTimestamp)
    const now = Date.now()
    if (
        Number.isNaN(timestamp) ||
        timestamp > now ||
        now - timestamp > DEFAULT_PROXY_TIMEOUT_IN_MS
    ) {
        return originalIP
    }

    // NOTE: validate signature and proxy IP
    if (!Object.hasOwn(knownProxies, xProxyId)) {
        return originalIP
    }
    const proxyConfig = knownProxies[xProxyId]
    const isRequestFromProxy = Array.isArray(proxyConfig.address)
        ? proxyConfig.address.includes(originalIP)
        : proxyConfig.address === originalIP
    if (!isRequestFromProxy) {
        return originalIP
    }

    try {
        // NOTE: config is passed from outside, where its obtained from .env, so its not hard-coded
        // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
        const jwtPayload = jwt.verify(xProxySignature, proxyConfig.secret, { algorithms: ['HS256'] })
        const expectedPayloadSchema = z.object({
            [X_PROXY_TIMESTAMP_HEADER]: z.literal(xProxyTimestamp),
            [X_PROXY_IP_HEADER]: z.literal(xProxyIp),
            [X_PROXY_ID_HEADER]: z.literal(xProxyId),
            method: z.literal(req.method),
            url: z.literal(req.url),
        })
        const { success: isMatchingSignature } = expectedPayloadSchema.safeParse(jwtPayload)

        return isMatchingSignature ? xProxyIp : originalIP
    } catch {
        return originalIP
    }
}

export function getProxyHeadersForIp (method: string, url: string, ip: string, proxyId: string, secret: string): ProxyHeaders {
    const timestampString = String(Date.now())

    return {
        [X_PROXY_IP_HEADER]: ip,
        [X_PROXY_ID_HEADER]: proxyId,
        [X_PROXY_TIMESTAMP_HEADER]: timestampString,
        [X_PROXY_SIGNATURE_HEADER]: jwt.sign({
            [X_PROXY_IP_HEADER]: ip,
            [X_PROXY_ID_HEADER]: proxyId,
            [X_PROXY_TIMESTAMP_HEADER]: timestampString,
            method,
            url,
        }, secret, {
            expiresIn: Math.round(DEFAULT_PROXY_TIMEOUT_IN_MS / 1000),
            algorithm: 'HS256',
        }),
    }
}
