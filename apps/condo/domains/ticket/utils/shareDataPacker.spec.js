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

    it('should decrypt existing links', () => {
        const data = 'gkQ+t4yV53ToCmiGjPcjzzVICyDa76Hy474vWtbUk6P4Am66KU9zqLowFX9C/4kjstxxHbzBTRMqDqrGIjsAasdE9NR2gNLy4hPGATna6pFstDgdY45lPn+XRsuGaL55YHMKTH5gjVrQMbc34+Ro7xEGTiD25d0QngGNe8R4xKZ0JJO9df943k3botuxgyena+bjGZNEvy3vNmA3FPINNA=='
        const unpacked = '{"date":"2021-06-17T13:26:52.479Z","number":2135,"details":"fragment fragment fragment fragment fragment fragment","id":"3c05ed8c-56b1-41bf-9c9a-8dfeaa07feb1"}'

        expect(unpackShareData(data)).toEqual(unpacked)
    })
})
