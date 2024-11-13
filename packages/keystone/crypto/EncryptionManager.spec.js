const crypto = require('crypto')

const { faker } = require('@faker-js/faker')
const { groupBy } = require('lodash')

const { EncryptionManager, SUPPORTED_MODES } = require('@open-condo/keystone/crypto/EncryptionManager')
const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

function generateVersions () {
    const cipherAlgorithms = crypto.getCiphers()
    const cipherInfos = cipherAlgorithms.map(alg => crypto.getCipherInfo(alg))
    const modes = new Set(cipherInfos.map(info => info.mode))

    const secrets = cipherInfos.map((info) => faker.random.alphaNumeric(info.keyLength | 0))
    const versions = cipherAlgorithms.map((algorithm, i) => ({
        mode: cipherInfos[i].mode,
        id: faker.random.alphaNumeric(10),
        algorithm: algorithm,
        secret: secrets[i],
    }))
    return { versions: groupBy(versions, 'mode'), modes: [...modes] }
}

describe('EncryptionManager', () => {
    const { versions: versionsByMode, modes } = generateVersions()
    const unsupportedModes = modes.filter(mode => !SUPPORTED_MODES.includes(mode))

    describe('Supported algorithm modes', () => {

        describe.each(SUPPORTED_MODES)('%p', (mode) => {
            const versions = versionsByMode[mode]

            test.each(versions)('$algorithm', (version) => {
                const manager = new EncryptionManager({ customConfig: [version], useDefaultConfig: false })

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
                    new EncryptionManager({ customConfig: [version], useDefaultConfig: false })
                }, (err) => {
                    expect(err).toBeDefined()
                    expect(err.toString()).toMatch(`Algorithm ${version.algorithm} is not supported right now`)
                })
            })

        })

    })

})