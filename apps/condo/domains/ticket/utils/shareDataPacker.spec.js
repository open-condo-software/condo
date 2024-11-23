import { getRandomString } from '@open-condo/keystone/test.utils'

import { packShareData, unpackShareData } from './shareDataPacker'

describe('Crypto packShareData and unpackShareData', () => {
    it('should correctly pack and unpack data', () => {
        const testData = getRandomString()
        const packedData = packShareData(testData)
        const unpackedData = unpackShareData(packedData)

        expect(unpackedData).toBe(testData)
    })

    it('should produce different encrypted values for different inputs', () => {
        const testData1 = 'Hello, world!'
        const testData2 = 'Goodbye, world!'
        const packedData1 = packShareData(testData1)
        const packedData2 = packShareData(testData2)

        expect(packedData1).not.toBe(packedData2)
    })

    it('should throw an error when decrypting invalid data', () => {
        const invalidData = 'InvalidEncryptedString'
        expect(() => unpackShareData(invalidData)).toThrow()
    })

    it('should produce encrypted text that is different from original text', () => {
        const testData = 'Sensitive information'
        const packedData = packShareData(testData)

        expect(packedData).not.toBe(testData)
    })
})
