const { faker } = require('@faker-js/faker')

const { SbbolSecretStorage } = require('./SbbolSecretStorage')

describe('SbbolSecretStorage', () => {

    function generateUserAndOrganizationIds (override = {}) {
        return {
            userId: faker.datatype.uuid(),
            organizationId: faker.datatype.uuid(),
            ...override,
        }
    }

    it('sets and gets clientSecret', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        await storage.setClientSecret(value)
        expect(await storage.getClientSecret()).toEqual(value)
    })

    it('sets and gets refreshToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const { userId, organizationId }  = generateUserAndOrganizationIds()
        await storage.setRefreshToken(value, userId, organizationId)
        expect(await storage.getRefreshToken(userId, organizationId)).toEqual(value)
    })

    it('returns false for isRefreshTokenExpired() for not expired refreshToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const { userId, organizationId }  = generateUserAndOrganizationIds()
        await storage.setRefreshToken(value, userId, organizationId)
        expect(await storage.isRefreshTokenExpired(userId, organizationId)).toBeFalsy()
    })

    it('sets and gets accessToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const { userId, organizationId }  = generateUserAndOrganizationIds()
        await storage.setAccessToken(value, userId, organizationId)
        const { accessToken, ttl } = await storage.getAccessToken(userId, organizationId)
        expect(accessToken).toEqual(value)
        expect(ttl).toBeTruthy()
    })

    it('returns false for isAccessTokenExpired() for not expired accessToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const { userId, organizationId }  = generateUserAndOrganizationIds()
        await storage.setAccessToken(value, userId, organizationId)
        expect(await storage.isAccessTokenExpired(userId, organizationId)).toBeFalsy()
    })

    it('Used for inspection of stored values in case when there is no direct access to Redis', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const { userId, organizationId }  = generateUserAndOrganizationIds()
        const value = faker.datatype.uuid()

        await storage.setClientSecret(value)
        await storage.setRefreshToken(value, userId, organizationId)
        await storage.setAccessToken(value, userId, organizationId)

        const clientSecret = await storage.getClientSecret()
        const { accessToken } = await storage.getAccessToken(userId, organizationId)
        const refreshToken = await storage.getRefreshToken(userId, organizationId)

        const rowKeys = await storage.getRawKeyValues(userId, organizationId)
        const valuesOfRowKeys = Object.values(rowKeys)

        expect(valuesOfRowKeys.includes(clientSecret)).toBeTruthy()
        expect(valuesOfRowKeys.includes(accessToken)).toBeTruthy()
        expect(valuesOfRowKeys.includes(refreshToken)).toBeTruthy()
    })
})