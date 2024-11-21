const crypto = require('crypto')

const { faker } = require('@faker-js/faker')
const { groupBy } = require('lodash')

const { EncryptionManager, SUPPORTED_MODES } = require('@open-condo/keystone/crypto/EncryptionManager')
const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

function generateVersions () {
    const cipherAlgorithms = crypto.getCiphers()
    const cipherInfos = cipherAlgorithms.map(alg => crypto.getCipherInfo(alg))
    const modes = new Set(cipherInfos.map(info => info.mode))

    const secrets = cipherInfos.map((info) => faker.random.alphaNumeric(info.keyLength || 0))
    const versions = cipherAlgorithms.map((algorithm, i) => ({
        mode: cipherInfos[i].mode,
        id: faker.random.alphaNumeric(10),
        algorithm: algorithm,
        secret: secrets[i],
    }))
    return { versions: groupBy(versions, 'mode'), modes: [...modes] }
}

function generateVersionsInMode (mode, count = 1) {
    const cipherAlgorithms = crypto.getCiphers()
    const cipherInfos = cipherAlgorithms
        .map(alg => crypto.getCipherInfo(alg))
        .filter(info => info.mode === mode)
    const infosForVersions = faker.helpers.arrayElements(cipherInfos, count)
    const versionsArray = infosForVersions.map(info => {
        return {
            id: faker.random.alphaNumeric(10),
            algorithm: info.name,
            secret: faker.random.alphaNumeric(info.keyLength || 0),
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

                const initialString = faker.random.alphaNumeric(20)
                const encrypted = manager.encrypt(initialString)
                expect(encrypted).not.toEqual(initialString)
                expect(encrypted.split(':')).toHaveLength(3)

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
                    expect(err.toString()).toMatch(`Algorithm ${version.algorithm} is not supported right now`)
                })
            })

        })

    })

    test('Can decrypt from multiple versions', () => {
        const differentVersionsCount = 3
        const exampleString = faker.random.alphaNumeric(10)
        const encryptedInDifferentVersionsStrings = []
        const versions = {}

        for (let i = 0; i < differentVersionsCount; i++) {
            const versionsSingle = generateVersionsInMode('cbc', 1)
            const encryptionVersionId = Object.keys(versionsSingle)[0]
            const manager = new EncryptionManager({ versions: versionsSingle, encryptionVersionId  })
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

})