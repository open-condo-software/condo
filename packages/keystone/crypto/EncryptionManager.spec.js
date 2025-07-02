const crypto = require('crypto')

const { faker } = require('@faker-js/faker')
const { groupBy } = require('lodash')

const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager')
const { catchErrorFrom, getRandomString } = require('@open-condo/keystone/test.utils')

const SUPPORTED_MODES = ['cbc', 'ctr', 'gcm']
const ENCRYPTION_PREFIX = ['\u{200B}', '\u{034F}', '\u{180C}', '\u{1D175}', '\u{E003B}', '\u{2800}'].join('')

function getSecretKey (len) {
    return crypto.randomBytes(len)
}

function expectToThrowOrDecryptOrWrongResult (encryptionManager, encryptedValue, expectedValue) {
    let didThrow = false
    let didGiveWrongResult = false
    try {
        const decrypted = encryptionManager.decrypt(encryptedValue)
        didGiveWrongResult = decrypted !== expectedValue
    } catch {
        didThrow = true
    }
    expect(didThrow || didGiveWrongResult).toBe(true)
}

/**
 * NOTE: generateVersions generates a lot of combinations of algorithms, which are available on the machine
 * and provided by OpenSSL binaries
 * However, modern Node environments does not fully support all of them, since some are deprecated
 * You can run node with NODE_OPTIONS="--openssl-legacy-provider" to be backward-compatible,
 * However, in test we'll only test ones available by current Node runtime
 */
function _isUsableCipher (alg, keyLen, ivLen = 0) {
    try {
        const key = crypto.randomBytes(keyLen || 16)
        const iv = ivLen ? crypto.randomBytes(ivLen) : null
        const c = crypto.createCipheriv(alg, key, iv)
        c.update(Buffer.alloc(1))
        c.final()
        return true
    } catch {
        return false
    }
}

function _getUsableCyphers () {
    return crypto.getCiphers()
        .filter(alg => {
            const info = crypto.getCipherInfo(alg)
            return _isUsableCipher(alg, info.keyLength, info.ivLength)
        })
}

function generateVersions () {
    const cipherAlgorithms = _getUsableCyphers()

    const cipherInfos = cipherAlgorithms.map(alg => crypto.getCipherInfo(alg))
    const modes = new Set(cipherInfos.map(info => info.mode))

    const secrets = cipherInfos.map((info) => getSecretKey(info.keyLength || 0))
    const versions = cipherAlgorithms.map((algorithm, i) => ({
        mode: cipherInfos[i].mode,
        id: getRandomString(),
        algorithm: algorithm,
        secret: secrets[i],
    }))
    return { versions: groupBy(versions, 'mode'), modes: [...modes] }
}

function generateVersionsInMode (mode, count = 1) {
    const cipherAlgorithms = _getUsableCyphers()
    const cipherInfos = cipherAlgorithms
        .map(alg => crypto.getCipherInfo(alg))
        .filter(info => info.mode === mode)
    const infosForVersions = faker.helpers.arrayElements(cipherInfos, count)
    const versionsArray = infosForVersions.map(info => {
        return {
            id: getRandomString(),
            algorithm: info.name,
            secret: getSecretKey(info.keyLength || 0),
        }
    })
    return versionsArray.reduce((versions, currentVersion) => {
        versions[currentVersion.id] = { algorithm: currentVersion.algorithm, secret: currentVersion.secret }
        return versions
    }, {})
}

describe('EncryptionManager', () => {
    const { versions: versionsByMode, modes } = generateVersions()
    const unsupportedModes = modes.filter(mode => !SUPPORTED_MODES.includes(mode))

    describe('Supported algorithm modes', () => {

        describe.each(SUPPORTED_MODES)('%p', (mode) => {
            const versions = versionsByMode[mode]

            test.each(versions)('$algorithm', (version) => {
                const manager = new EncryptionManager({ versions: { [version.id]: version }, encryptionVersionId: version.id })

                const initialString = getRandomString()
                const encrypted = manager.encrypt(initialString)
                expect(encrypted).not.toEqual(initialString)
                const parts = encrypted.split(':')
                expect(parts).toHaveLength(3)
                expect(parts[0]).toEqual(ENCRYPTION_PREFIX)
                expect(parts[1]).toEqual(version.id)

                const decrypted = manager.decrypt(encrypted)
                expect(decrypted).toEqual(initialString)
            })

        })

    })

    describe('Unsupported algorithm modes', () => {

        describe.each(unsupportedModes)('%p', (mode) => {
            const versions = versionsByMode[mode]

            test.each(versions)('$algorithm', async (version) => {
                await catchErrorFrom(async () => {
                    new EncryptionManager({ versions: { [version.id]: version }, encryptionVersionId: version.id })
                }, (err) => {
                    expect(err).toBeDefined()
                })
            })

        })

    })

    describe('Compressors', () => {
        const secretKeyLen = 32
        const algorithms = ['aes-256-gcm', 'aes-256-cbc']
        const compressors = ['noop', 'brotli']
        const cases = algorithms.flatMap(algorithm =>
            compressors.map(compressor => [algorithm, compressor])
        )

        test.each(cases)('%p %p', (algorithm, compressor) => {
            const versionId = getRandomString()
            const versions = {
                [versionId]: {
                    algorithm,
                    secret: crypto.randomBytes(secretKeyLen),
                    compressor,
                },
            }
            const manager = new EncryptionManager({ versions, encryptionVersionId: versionId })
            const exampleString = getRandomString()
            const encrypted = manager.encrypt(exampleString)
            expect(manager.decrypt(encrypted)).toEqual(exampleString)
        })
    })

    describe('KeyDerivers', () => {
        const secretKeyLen = 32
        const algorithms = ['aes-256-gcm', 'aes-256-cbc']
        const keyDerivers = ['noop', 'pbkdf2-sha512']
        const cases = algorithms.flatMap(algorithm =>
            keyDerivers.map(keyDeriver => [algorithm, keyDeriver])
        )
        test.each(cases)('%p %p', (algorithm, keyDeriver) => {
            const versionId = getRandomString()
            const versions = {
                [versionId]: {
                    algorithm,
                    secret: crypto.randomBytes(secretKeyLen),
                    keyDeriver,
                },
            }
            const manager = new EncryptionManager({ versions, encryptionVersionId: versionId })
            const exampleString = getRandomString()
            const encrypted = manager.encrypt(exampleString)
            expect(manager.decrypt(encrypted)).toEqual(exampleString)
        })
    })

    test('Can decrypt from multiple versions', () => {
        const differentVersionsCount = 3
        const exampleString = getRandomString()
        const encryptedInDifferentVersionsStrings = []
        const versions = {}

        for (let i = 0; i < differentVersionsCount; i++) {
            const versionsSingle = generateVersionsInMode('cbc', 1)
            const encryptionVersionId = Object.keys(versionsSingle)[0]
            const manager = new EncryptionManager({ versions: versionsSingle, encryptionVersionId })
            encryptedInDifferentVersionsStrings.push(manager.encrypt(exampleString))
            versions[encryptionVersionId] = versionsSingle[encryptionVersionId]
        }
        expect(Object.keys(versions)).toHaveLength(differentVersionsCount)
        expect(new Set(encryptedInDifferentVersionsStrings).size).toBe(differentVersionsCount)
        const encryptionVersionId = faker.helpers.arrayElement(Object.keys(versions))
        const manager = new EncryptionManager({ versions, encryptionVersionId })

        encryptedInDifferentVersionsStrings.forEach(encryptedString => {
            const decrypted = manager.decrypt(encryptedString)
            expect(decrypted).toEqual(exampleString)
        })
    })

    describe('Unsuccessful decryption', () => {
        const manager = new EncryptionManager({
            versions: {
                '1': { algorithm: 'aes-256-cbc', secret: getSecretKey(32) },
            },
            encryptionVersionId: '1',
        })

        const nonStrings = [
            [],
            {},
            null,
            undefined,
            new Date(),
            123,
            Symbol(),
        ]

        test.each(nonStrings)('Passed non string %p', (nonString) => {
            expect(() => manager.decrypt(nonString)).toThrow()
        })

        test('Is not encrypted', () => {
            const notEncrypted = getRandomString()
            expect(() => manager.decrypt(notEncrypted)).toThrow()
        })

        test('Is encrypted in version, which not provided', () => {
            const anotherManager = new EncryptionManager({
                versions: { '2': { algorithm: 'aes-256-cbc', secret: getSecretKey(32) } },
                encryptionVersionId: '2',
            })
            const exampleString = getRandomString()
            const encryptedString = anotherManager.encrypt(exampleString)
            expect(() => manager.decrypt(encryptedString)).toThrow()
        })

        test('Versions are same, but secret or algorithm differs', () => {
            const managerAnotherAlgorithm = new EncryptionManager({
                versions: { '1': { algorithm: 'aes-128-cbc', secret: getSecretKey(16) } },
                encryptionVersionId: '1',
            })
            const managerAnotherSecret = new EncryptionManager({
                versions: { '1': { algorithm: 'aes-256-cbc', secret: getSecretKey(32) } },
                encryptionVersionId: '1',
            })
            const exampleValue = getRandomString()
            const encryptedWithDifferentAlgorithm = managerAnotherAlgorithm.encrypt(exampleValue)
            const encryptedWithDifferentSecret = managerAnotherSecret.encrypt(exampleValue)

            expectToThrowOrDecryptOrWrongResult(manager, encryptedWithDifferentAlgorithm, exampleValue)
            expectToThrowOrDecryptOrWrongResult(manager, encryptedWithDifferentSecret, exampleValue)
        })
    })

    describe('isEncrypted', () => {
        const manager = new EncryptionManager({
            versions: {
                '1': { algorithm: 'aes-256-cbc', secret: getSecretKey(32) },
            },
            encryptionVersionId: '1',
        })

        test('Checks, that value was encrypted with one of provided versions', () => {
            const exampleValue = getRandomString()
            const encrypted = manager.encrypt(exampleValue)

            const anotherManager = new EncryptionManager({
                versions: { '2': { algorithm: 'aes-256-cbc', secret: getSecretKey(32) } },
                encryptionVersionId: '2',
            })
            const anotherEncrypted = anotherManager.encrypt(exampleValue)

            expect(manager.isEncrypted(encrypted)).toBe(true)
            expect(manager.isEncrypted(exampleValue)).toBe(false)
            expect(manager.isEncrypted(anotherEncrypted)).toBe(false)
        })

    })
})