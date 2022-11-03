const faker = require('faker')
const { SbbolSecretStorage } = require('./SbbolSecretStorage')

describe('SbbolSecretStorage', () => {
    it('sets and gets clientSecret', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        storage.setClientSecret(value)
        expect(await storage.getClientSecret()).toEqual(value)
    })

    it('sets and gets refreshToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        storage.setRefreshToken(value)
        expect(await storage.getRefreshToken()).toEqual(value)
    })

    it('returns false for isRefreshTokenExpired() for not expired refreshToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        storage.setRefreshToken(value)
        expect(await storage.isRefreshTokenExpired()).toBeFalsy()
    })

    it('sets and gets accessToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        storage.setAccessToken(value)
        expect(await storage.getAccessToken()).toEqual(value)
    })

    it('returns false for isAccessTokenExpired() for not expired accessToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        const value = faker.datatype.uuid()
        storage.setAccessToken(value)
        expect(await storage.isAccessTokenExpired()).toBeFalsy()
    })
})