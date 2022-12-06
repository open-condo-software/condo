const faker = require('faker')
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
        await storage.setRefreshToken(value, userId)
        expect(await storage.getRefreshToken(userId)).toEqual(value)
    })

    it('returns false for isRefreshTokenExpired() for not expired refreshToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        await storage.setRefreshToken(value, userId)
        expect(await storage.isRefreshTokenExpired(userId)).toBeFalsy()
    })

    it('sets and gets accessToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        await storage.setAccessToken(value, userId)
        expect(await storage.getAccessToken(userId)).toEqual(value)
    })

    it('returns false for isAccessTokenExpired() for not expired accessToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        const userId = faker.datatype.uuid()
        await storage.setAccessToken(value, userId)
        expect(await storage.isAccessTokenExpired(userId)).toBeFalsy()
    })
})