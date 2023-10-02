const conf = require('@open-condo/config')

const { SberIdIdentityIntegration } = require('./SberIdIdentityIntegration')

// init vars
const integration = new SberIdIdentityIntegration()
const callbackPath = '/api/sber_id/auth/callback'
const callbackUri = `${conf.SERVER_URL}${callbackPath}`

describe('SberIdIdentityIntegration', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    it('Generate login form params using checks', async () => {
        const nonce = 'nonce'
        const state = 'state'
        const url = await integration.generateLoginFormParams({ nonce, state })

        expect(url.searchParams.get('nonce')).toEqual(nonce)
        expect(url.searchParams.get('state')).toEqual(state)
        expect(url.searchParams.get('redirect_uri')).toEqual(callbackUri)
    })

    it('Generate login form params using redirectUrl', async () => {
        const nonce = 'nonce'
        const state = 'state'
        const redirectUrl = 'https://example.com/callback'
        const url = await integration.generateLoginFormParams({ nonce, state }, redirectUrl)

        expect(url.searchParams.get('nonce')).toEqual(nonce)
        expect(url.searchParams.get('state')).toEqual(state)
        expect(url.searchParams.get('redirect_uri')).toEqual(redirectUrl)
    })

    it('Capitalize name properly', async () => {
        expect(integration.capitalizeName('Edward Lodewijk Van Halen')).toEqual('Edward Lodewijk Van Halen')
        expect(integration.capitalizeName('edward lodewijk van halen')).toEqual('Edward Lodewijk Van Halen')
        expect(integration.capitalizeName('Edward Lodewijk Van HALEN')).toEqual('Edward Lodewijk Van Halen')
        expect(integration.capitalizeName('EDWARD LODEWIJK VAN HALEN')).toEqual('Edward Lodewijk Van Halen')
        expect(integration.capitalizeName('EDWARD     LODEWIJK VAN HALEN    ')).toEqual('Edward Lodewijk Van Halen')
        expect(integration.capitalizeName('     EDWARD LODEWIJK VAN HALEN')).toEqual('Edward Lodewijk Van Halen')
    })
})