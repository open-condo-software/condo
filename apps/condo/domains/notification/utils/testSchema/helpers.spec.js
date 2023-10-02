const { faker } = require('@faker-js/faker')
const sample = require('lodash/sample')

const { getRandomTokenData } = require('./helpers')

const { PUSH_TRANSPORT_TYPES } = require('../../constants/constants')

const UUID_LENGTH = 36

describe('helpers', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('getRandomTokenData', () => {
        it('generates random device data of valid structure', async () => {
            const device = getRandomTokenData()

            expect(device.deviceId).toBeDefined()
            expect(device.pushToken).toBeDefined()
            expect(device.pushTransport).toBeDefined()
            expect(device.meta).toBeDefined()

            expect(device.deviceId).toHaveLength(UUID_LENGTH)
            expect(device.pushToken).toHaveLength(UUID_LENGTH)
            expect(PUSH_TRANSPORT_TYPES).toContain(device.pushTransport)
            expect(device.meta).toMatchObject({ pushTransport: device.pushTransport })
        })

        it('substitutes deviceId value correctly', async () => {
            const deviceId = faker.datatype.uuid()
            const device = getRandomTokenData({ deviceId })

            expect(device.deviceId).toBeDefined()
            expect(device.deviceId).toEqual(deviceId)
        })

        it('substitutes pushToken value correctly', async () => {
            const pushToken = faker.datatype.uuid()
            const device = getRandomTokenData({ pushToken })

            expect(device.pushToken).toBeDefined()
            expect(device.pushToken).toEqual(pushToken)
        })

        it('substitutes pushTransport value correctly', async () => {
            const pushTransport = sample(PUSH_TRANSPORT_TYPES)
            const device = getRandomTokenData({ pushTransport })

            expect(device.pushTransport).toBeDefined()
            expect(device.pushTransport).toEqual(pushTransport)
        })

        it('substitutes meta value correctly', async () => {
            const meta = { randomValue: faker.datatype.uuid() }
            const device = getRandomTokenData({ meta })

            expect(device.meta).toBeDefined()
            expect(device.meta).toMatchObject(meta)
        })
    })
})
