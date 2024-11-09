const crypto = require('crypto')

const { faker } = require('@faker-js/faker')
const { groupBy } = require('lodash')

const { CipherManager, SUPPORTED_MODES } = require('@open-condo/keystone/cipher')
const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

function generateVersions () {
    const cipherAlgorithms = crypto.getCiphers()
    const cipherInfos = cipherAlgorithms.map(alg => crypto.getCipherInfo(alg))
    const modes = new Set(cipherInfos.map(info => info.mode))

    const secrets = cipherInfos.map((info) => faker.random.alphaNumeric(info.keyLength | 0))
    const versions = cipherAlgorithms.map((algorithm, i) => ({
        mode: cipherInfos[i].mode,
        version: faker.random.alphaNumeric(10),
        cipher: algorithm,
        secret: secrets[i],
    }))
    return { versions: groupBy(versions, 'mode'), modes: [...modes] }
}

describe('cipher', () => {
    describe('CipherManager', () => {
        const { versions: versionsByMode, modes } = generateVersions()
        const unsupportedModes = modes.filter(mode => !SUPPORTED_MODES.includes(mode))

        describe('Supported cipher modes', () => {

            describe.each(SUPPORTED_MODES)('%p', (mode) => {
                const versions = versionsByMode[mode]

                test.each(versions)('$cipher', (version) => {
                    const manager = new CipherManager([version], version.version)

                    const initialString = faker.random.alphaNumeric(20)
                    const { encrypted } = manager.encrypt(initialString, version)
                    expect(encrypted).not.toEqual(initialString)
                    expect(encrypted.split(':')).toHaveLength(3)

                    const { decrypted } = manager.decrypt(encrypted)
                    expect(decrypted).toEqual(initialString)
                })

                test('all ciphers of mode in one manager', () => {
                    const manager = new CipherManager(versions, faker.helpers.arrayElement(versions).version)

                    const initialStrings = faker.datatype.array(versions.length).map(String)
                    const encryptedStrings = []

                    for (let i = 0; i < initialStrings.length; i++) {
                        const usingVersion = versions[i].version
                        const { encrypted, version } = manager.encrypt(initialStrings[i], { version: usingVersion })

                        expect(encrypted).not.toEqual(initialStrings[i])
                        expect(encrypted.split(':')).toHaveLength(3)
                        expect(version).toEqual(usingVersion)

                        encryptedStrings.push(encrypted)
                    }

                    for (let i = 0; i < encryptedStrings.length; i++) {
                        const { decrypted, version } = manager.decrypt(encryptedStrings[i])

                        expect(decrypted).toEqual(initialStrings[i])
                        expect(version).toEqual(versions[i].version)
                    }
                })

            })

            test('all supported ciphers at once', () => {
                const versions = SUPPORTED_MODES.flatMap(mode => versionsByMode[mode])
                const currentVersion = faker.helpers.arrayElement(versions).version
                const manager = new CipherManager(versions, currentVersion)

                const initialStrings = faker.datatype.array(versions.length).map(String)
                const encryptedStrings = []

                for (let i = 0; i < initialStrings.length; i++) {
                    const usingVersion = versions[i].version
                    const { encrypted, version } = manager.encrypt(initialStrings[i], { version: usingVersion })

                    expect(encrypted).not.toEqual(initialStrings[i])
                    expect(encrypted.split(':')).toHaveLength(3)
                    expect(version).toEqual(usingVersion)

                    encryptedStrings.push(encrypted)
                }

                for (let i = 0; i < encryptedStrings.length; i++) {
                    const { decrypted, version } = manager.decrypt(encryptedStrings[i])

                    expect(decrypted).toEqual(initialStrings[i])
                    expect(version).toEqual(versions[i].version)
                }
            })

        })

        describe('Unsupported cipher modes', () => {
            
            describe.each(unsupportedModes)('%p', (mode) => {
                const versions = versionsByMode[mode]
                
                test.each(versions)('$cipher', async (version) => {
                    await catchErrorFrom(async () => {
                        new CipherManager([version], version.version)
                    }, (err) => {
                        expect(err).toBeDefined()
                        expect(err.toString()).toMatch(`cipher ${version.cipher} is not supported right now`)
                    })
                })
                
            })
            
        })
        
    })
})