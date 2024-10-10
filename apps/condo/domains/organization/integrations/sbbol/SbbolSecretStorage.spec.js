const { faker } = require('@faker-js/faker')

const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { SbbolSecretStorage } = require('./SbbolSecretStorage')

describe('SbbolSecretStorage', () => {
    it('sets and gets clientSecret', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        await storage.setClientSecret(value)
        expect(await storage.getClientSecret()).toEqual(value)
    })

    it('sets and gets refreshToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        const orgId = faker.datatype.uuid()
        await storage.setRefreshToken(value, userId, orgId)
        expect(await storage.getRefreshToken(userId, orgId)).toEqual(value)
    })

    it('error setRefreshToken without orgId', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        await catchErrorFrom(async () => await storage.setRefreshToken(value, userId),
            (e) => {
                expect(e.message).toEqual('organizationId is required for setRefreshToken')
            })
    })

    it('error getRefreshToken without orgId', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        await catchErrorFrom(async () => await storage.getRefreshToken(userId),
            (e) => {
                expect(e.message).toEqual('organizationId is required for getRefreshToken')
            })
    })

    it('returns false for isRefreshTokenExpired() for not expired refreshToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        const orgId = faker.datatype.uuid()
        await storage.setRefreshToken(value, userId, orgId)
        expect(await storage.isRefreshTokenExpired(userId, orgId)).toBeFalsy()
    })

    it('sets and gets accessToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        const orgId = faker.datatype.uuid()
        await storage.setAccessToken(value, userId, orgId)
        const { accessToken, ttl } = await storage.getAccessToken(userId, orgId)
        expect(accessToken).toEqual(value)
        expect(ttl).toBeTruthy()
    })

    it('error set accessToken without orgId', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        await catchErrorFrom(async () => await storage.setAccessToken(value, userId),
            (e) => {
                expect(e.message).toEqual('organizationId is required for setAccessToken')
            })
    })

    it('error get accessToken without orgId', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const userId = faker.datatype.uuid()
        await catchErrorFrom(async () => await storage.getAccessToken(userId),
            (e) => {
                expect(e.message).toEqual('organizationId is required for getAccessToken')
            })
    })

    it('returns false for isAccessTokenExpired() for not expired accessToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        const orgId = faker.datatype.uuid()
        await storage.setAccessToken(value, userId, orgId)
        expect(await storage.isAccessTokenExpired(userId, orgId)).toBeFalsy()
    })

    it('Used for inspection of stored values in case when there is no direct access to Redis', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const userId = faker.datatype.uuid()
        const value = faker.datatype.uuid()
        const orgId = faker.datatype.uuid()

        await storage.setClientSecret(value)
        await storage.setRefreshToken(value, userId, orgId)
        await storage.setAccessToken(value, userId, orgId)

        const clientSecret = await storage.getClientSecret()
        const { accessToken } = await storage.getAccessToken(userId, orgId)
        const refreshToken = await storage.getRefreshToken(userId, orgId)

        const rowKeys = await storage.getRawKeyValues(userId, orgId)
        const valuesOfRowKeys = Object.values(rowKeys)

        expect(valuesOfRowKeys.includes(clientSecret)).toBeTruthy()
        expect(valuesOfRowKeys.includes(accessToken)).toBeTruthy()
        expect(valuesOfRowKeys.includes(refreshToken)).toBeTruthy()
    })
})