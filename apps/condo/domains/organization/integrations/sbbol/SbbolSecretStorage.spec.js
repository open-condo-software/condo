const { SbbolSecretStorage } = require('./SbbolSecretStorage')

describe('SbbolSecretStorage', () => {
    it('sets and gets clientSecret', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        storage.setClientSecret('abcdefg-1234567')
        expect(await storage.getClientSecret()).toEqual('abcdefg-1234567')
    })

    it('sets and gets refreshToken', async () => {
        const storage = new SbbolSecretStorage('auth', '12345')
        storage.setRefreshToken('abcdefg-1234567')
        expect(await storage.getRefreshToken()).toEqual('abcdefg-1234567')
    })
})