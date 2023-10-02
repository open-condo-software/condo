const conf = require('@open-condo/config')

const { AppleIdIdentityIntegration } = require('./AppleIdIdentityIntegration')

// init vars
const integration = new AppleIdIdentityIntegration()
const APPLE_ID_CONFIG = process.env.APPLE_ID_CONFIG ? JSON.parse(process.env.APPLE_ID_CONFIG) : {}
const {
    redirectUri,
} = APPLE_ID_CONFIG
const callbackPath = '/api/apple_id/auth/callback'
const callbackUri = redirectUri || `${conf.SERVER_URL}${callbackPath}`

describe('AppleIdIdentityIntegration', () => {
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
})