import { getRandomString } from '@open-condo/keystone/test.utils'

import { packShareData, unpackShareData } from './shareDataPacker'

const DATA = '{"date":"2021-06-17T13:26:52.479Z","number":2135,"details":"fragment fragment fragment fragment fragment fragment","id":"3c05ed8c-56b1-41bf-9c9a-8dfeaa07feb1"}'
const V1_ENCRYPTED_DATA = 'gkQ+t4yV53ToCmiGjPcjzzVICyDa76Hy474vWtbUk6P4Am66KU9zqLowFX9C/4kjstxxHbzBTRMqDqrGIjsAasdE9NR2gNLy4hPGATna6pFstDgdY45lPn+XRsuGaL55YHMKTH5gjVrQMbc34+Ro7xEGTiD25d0QngGNe8R4xKZ0JJO9df943k3botuxgyena+bjGZNEvy3vNmA3FPINNA=='
const V2_ENCRYPTED_DATA = '2:pi36FZ28yjeFnSg7hDPgcXIRHjG0jCLETcpR2AUTJtadr21cR/i7YzaiLMf29tjAWcen3ANiQwAfWEcOjRbft9PuEQki2zmnLdDjuMBtO9++4O7S+wy6hfwunBYCMRYk6CyZAWLcdQRNdE8zw6oLxnzVQw=='
const V3_ENCRYPTED_DATA = '3:xS9v+SB2MQF78cyv84maFvSHIvzQ/N220rK+dWx3AJY6EIGBFh9FHoUdud2oFgCdVd/LWlmCbYwSqyfzn6Fsp3cTO4znweTGmpyhLjFPV0Zz4WVCGj3Rf1W9vZ1kbkVu736I+dM5p6rL'

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

    describe('Should detect protocol from prefix and decrypt existing links', () => {
        test.each(
            [V1_ENCRYPTED_DATA, V2_ENCRYPTED_DATA, V3_ENCRYPTED_DATA]
                .map((data, idx) => [`v${idx + 1}`, data])
        )('%p data', (_, encryptedData) => {
            expect(unpackShareData(encryptedData)).toEqual(DATA)
        })
    })

    it('modern method should be more efficient', () => {
        const v3 = packShareData(DATA)

        expect(v3.length).toBeLessThan(V1_ENCRYPTED_DATA.length)
        expect(v3.length).toBeLessThan(V2_ENCRYPTED_DATA.length)
    })
})
