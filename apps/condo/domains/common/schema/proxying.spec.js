jest.resetModules()
jest.mock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')

    const getter = (_, name) => {
        if (name === 'TRUSTED_PROXIES_CONFIG') {
            return JSON.stringify({
                'simple-proxy-name': {
                    address: '1.2.3.4',
                    secret: '123',
                },
                'clustered-proxy-name': {
                    address: ['1.1.1.1', '2.2.2.2'],
                    secret: '456',
                },
            })
        }
        return conf[name]
    }

    return new Proxy(conf, { get: getter, set: jest.fn() })
})
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const jwt = require('jsonwebtoken')

const { fetch } = require('@open-condo/keystone/fetch')
const { setFakeClientMode, makeClient } = require('@open-condo/keystone/test.utils')
const { getProxyHeadersForIp } = require('@open-condo/miniapp-utils/helpers/proxying')

function _generateCombinations (options) {
    const keys = Object.keys(options)
    const total = Object.values(options).map(variants => variants.length).reduce((acc, cur) => acc * cur, 1)

    const combinations = []

    for (let i = 0; i < total; i++) {
        let left = i
        let spaceSize = total
        const combination = {}

        for (const key of keys) {
            const optionSize = spaceSize / options[key].length
            const option = Math.floor(left / optionSize)
            combination[key] = options[key][option]
            spaceSize = optionSize
            left -= option * optionSize
        }

        combinations.push(combination)
    }

    return combinations
}

async function expectIP (serverUrl, headers, ip, url = '/api/whoami', method = 'GET') {
    const response = await fetch(`${serverUrl}${url}`, {
        headers,
        method,
    })
    expect(response.status).toEqual(200)
    const jsonBody = await response.json()
    expect(jsonBody).toHaveProperty('ip', ip)
}

async function sleep (ms) {
    return new Promise((res) => {
        setTimeout(() => res(), ms)
    })
}


describe('Express proxying tests', () => {
    setFakeClientMode(index)

    let serverUrl

    beforeAll(async () => {
        const client = await makeClient()
        serverUrl =  client.serverUrl
    })

    describe('req.ip', () => {
        describe('Must trust all proxies by default (because of app.set("trust proxy", true))', () => {
            test('Simple x-forwarded-for', async () => {
                const ip = faker.internet.ip()
                await expectIP(serverUrl, {
                    'x-forwarded-for': ip,
                }, ip)
            })
            test('Array x-forwarded-for', async () => {
                const ip = faker.internet.ip()
                await expectIP(serverUrl, {
                    'x-forwarded-for': `${ip}, ${faker.internet.ip()}`,
                }, ip)
            })
        })
        describe('Must trust IP from x-proxy-ip if req is coming from trusted proxy with signature', () => {
            describe('Correct examples', () => {
                const urls = [
                    ['GET', '/api/whoami'],
                    ['GET', '/api/whoami?search=123'],
                    ['GET', '/api/whoami?search=123&a=123&a=456'],
                ]
                const proxies = [
                    ['simple-proxy-name', '1.2.3.4', '123'],
                    ['clustered-proxy-name', '1.1.1.1', '456'],
                    ['clustered-proxy-name', '2.2.2.2', '456'],
                ]
                describe.each(proxies)('Proxy: %p, proxy ip: %p',  (proxyId, proxyIp, secret) => {
                    test.each(urls)('Method: %p, url: %p', async (method, url) => {
                        const ip = faker.internet.ip()
                        await expectIP(serverUrl, {
                            ...getProxyHeadersForIp(method, url, ip, proxyId, secret),
                            'x-forwarded-for': proxyIp,
                        }, ip, url, method)
                    })
                })
            })
        })
        describe('Must not trust IP from x-proxy-ip if', () => {
            const requiredHeaders = [
                'x-proxy-ip',
                'x-proxy-id',
                'x-proxy-timestamp',
                'x-proxy-signature',
            ]
            test.each(requiredHeaders)('%p header is missing', async (headerName) => {
                const ip = faker.internet.ip()
                const headers = getProxyHeadersForIp('GET', '/api/whoami', ip, 'simple-proxy-name', '123')
                const proxyIp = '1.2.3.4'
                await expectIP(serverUrl, {
                    ...headers,
                    'x-forwarded-for': proxyIp,
                }, ip)
                delete headers[headerName]
                await expectIP(serverUrl, {
                    ...headers,
                    'x-forwarded-for': proxyIp,
                }, proxyIp)
            })
            test.each(requiredHeaders)('%p header is duplicated (Array)', async (headerName) => {
                const ip = faker.internet.ip()
                const headers = getProxyHeadersForIp('GET', '/api/whoami', ip, 'simple-proxy-name', '123')
                const proxyIp = '1.2.3.4'
                await expectIP(serverUrl, {
                    ...headers,
                    'x-forwarded-for': proxyIp,
                }, ip)

                const duplicatedHeaders = {
                    ...headers,
                    'x-forwarded-for': proxyIp,
                    [headerName]: `${headers[headerName]}, ${headers[headerName]}`,
                }

                await expectIP(serverUrl, duplicatedHeaders, proxyIp)
            })
            describe('IP is not IPv4 or IPv6', () => {
                const cases = [
                    [faker.internet.ip(), true],
                    [faker.internet.ipv6(), true],
                    [faker.random.alphaNumeric(12), false],
                ]
                test.each(cases)('%p', async (ip, shouldTrust) => {
                    const headers = getProxyHeadersForIp('GET', '/api/whoami', ip, 'simple-proxy-name', '123')
                    const proxyIp = '1.2.3.4'
                    await expectIP(serverUrl, {
                        ...headers,
                        'x-forwarded-for': proxyIp,
                    }, shouldTrust ? ip : proxyIp)
                })
            })
            describe('If timestamp is invalid', () => {
                const cases = [
                    ['Outdated', (now) => now - 6000],
                    ['In future', (now) => now + 1000],
                    ['In seconds instead of ms', (now) => Math.floor(now / 1000)],
                    ['Random number', (now) => now * 1000],
                    ['Some other value', () => 'some-other-value'],
                ]
                test.each(cases)('%p', async (_, getTimestamp) => {
                    const ip = faker.internet.ip()
                    const proxyIp = '1.2.3.4'
                    const now = Date.now()
                    const invalidTimestampString = String(getTimestamp(now))
                    const validTimestampString = String(now)
                    await expectIP(serverUrl, {
                        'x-proxy-ip': ip,
                        'x-proxy-id': 'simple-proxy-name',
                        'x-proxy-timestamp': validTimestampString,
                        'x-proxy-signature': jwt.sign({
                            'x-proxy-ip': ip,
                            'x-proxy-id': 'simple-proxy-name',
                            'x-proxy-timestamp': validTimestampString,
                            method: 'GET',
                            url: '/api/whoami',
                        // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                        }, '123'),
                        'x-forwarded-for': proxyIp,
                    }, ip)
                    await expectIP(serverUrl, {
                        'x-proxy-ip': ip,
                        'x-proxy-id': 'simple-proxy-name',
                        'x-proxy-timestamp': invalidTimestampString,
                        'x-proxy-signature': jwt.sign({
                            'x-proxy-ip': ip,
                            'x-proxy-id': 'simple-proxy-name',
                            'x-proxy-timestamp': invalidTimestampString,
                            method: 'GET',
                            url: '/api/whoami',
                        // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                        }, '123'),
                        'x-forwarded-for': proxyIp,
                    }, proxyIp)
                })
            })
            test('If proxy-id is unknown by server', async () => {
                const ip = faker.internet.ip()
                const headers = getProxyHeadersForIp('GET', '/api/whoami', ip, 'unknown-proxy-name', '123')
                const proxyIp = '1.2.3.4'
                await expectIP(serverUrl, {
                    ...headers,
                    'x-forwarded-for': proxyIp,
                }, proxyIp)
            })
            test('If request is coming from address not registered for proxy', async () => {
                const ip = faker.internet.ip()
                const headers = getProxyHeadersForIp('GET', '/api/whoami', ip, 'simple-proxy-name', '123')
                const validProxyIp = '1.2.3.4'
                const invalidProxyIp = faker.internet.ip()
                await expectIP(serverUrl, {
                    ...headers,
                    'x-forwarded-for': validProxyIp,
                }, ip)
                await expectIP(serverUrl, {
                    ...headers,
                    'x-forwarded-for': invalidProxyIp,
                }, invalidProxyIp)
            })
            test('If signature is invalid', async () => {
                const ip = faker.internet.ip()
                const headers = getProxyHeadersForIp('GET', '/api/whoami', ip, 'simple-proxy-name', '123')
                const proxyIp = '1.2.3.4'
                await expectIP(serverUrl, {
                    ...headers,
                    'x-proxy-signature': 'blah-blah-blah',
                    'x-forwarded-for': proxyIp,
                }, proxyIp)
            })
            describe('If some fields in decrypted signature is missing / does not match', () => {
                test.each(
                    _generateCombinations({
                        'x-proxy-ip': [true, '1.2.3.4.5', undefined],
                        'x-proxy-id': [true, 'unknown-id', undefined],
                        'x-proxy-timestamp': [true, String(Date.now() - 6000), undefined],
                        'method': [true, 'POST', undefined],
                        'url': [true, '/api/another-endpoint', undefined],
                    })
                        .filter(combination => Object.values(combination).some(v => v !== true))
                        .map(combination => [JSON.stringify(combination), combination])
                )('%p', async (_, combination) => {
                    const ip = faker.internet.ip()
                    const proxyIp = '1.2.3.4'
                    const timestampString = String(Date.now())
                    const validSignatureFields = {
                        'x-proxy-ip': ip,
                        'x-proxy-id': 'simple-proxy-name',
                        'x-proxy-timestamp': timestampString,
                        method: 'GET',
                        url: '/api/whoami',
                    }
                    const invalidSignatureFields = {
                        ...validSignatureFields,
                    }
                    await expectIP(serverUrl, {
                        'x-proxy-ip': ip,
                        'x-proxy-id': 'simple-proxy-name',
                        'x-proxy-timestamp': timestampString,
                        // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                        'x-proxy-signature': jwt.sign(validSignatureFields, '123'),
                        'x-forwarded-for': proxyIp,
                    }, ip)

                    for (const [propName, propValue] of Object.entries(combination)) {
                        if (propValue === undefined) {
                            delete invalidSignatureFields[propName]
                        } else if (propValue !== true) {
                            invalidSignatureFields[propName] = propValue
                        }
                    }

                    await expectIP(serverUrl, {
                        'x-proxy-ip': ip,
                        'x-proxy-id': 'simple-proxy-name',
                        'x-proxy-timestamp': timestampString,
                        // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                        'x-proxy-signature': jwt.sign(invalidSignatureFields, '123'),
                        'x-forwarded-for': proxyIp,
                    }, proxyIp)
                })
            })
            test('If signature is expired', async () => {
                const ip = faker.internet.ip()
                const proxyIp = '1.2.3.4'
                const now = Date.now()
                const expireInSeconds = 3
                const validTimestampString = String(now)
                const headers = {
                    'x-proxy-ip': ip,
                    'x-proxy-id': 'simple-proxy-name',
                    'x-proxy-timestamp': validTimestampString,
                    'x-proxy-signature': jwt.sign({
                        'x-proxy-ip': ip,
                        'x-proxy-id': 'simple-proxy-name',
                        'x-proxy-timestamp': validTimestampString,
                        method: 'GET',
                        url: '/api/whoami',
                    // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
                    }, '123', { expiresIn: expireInSeconds }),
                    'x-forwarded-for': proxyIp,
                }
                await expectIP(serverUrl, headers, ip)
                await sleep(expireInSeconds * 1000 + 50)
                await expectIP(serverUrl, headers, proxyIp)
            })
        })
    })
})