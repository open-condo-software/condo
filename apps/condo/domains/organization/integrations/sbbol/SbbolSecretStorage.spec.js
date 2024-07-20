const { faker } = require('@faker-js/faker')

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