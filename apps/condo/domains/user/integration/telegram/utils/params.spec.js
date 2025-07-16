const { faker } = require('@faker-js/faker')

const { STAFF } = require('@condo/domains/user/constants/common')

const {
    getRedirectUrl,
    getUserType,
    getBotId,
} = require('./params')

const getReqWithParam = (path, value) => {
    return {
        query: { [path]: value },
    }
}

describe('Telegram integration params utils', () => {

    it('getRedirectUrl', async () => {
        const redirectUrl = 'http://localhost:3000'
        const notSafeUrl = 'http://localhost:3000?javascript:alert(document.cookie)'

        expect(getRedirectUrl(getReqWithParam('redirectUrl', redirectUrl))).toEqual(redirectUrl)
        expect(getRedirectUrl({ ...getReqWithParam('', ''), query: { redirectUrl } })).toEqual(redirectUrl)
        expect(getRedirectUrl(getReqWithParam('redirectUrl', notSafeUrl))).toEqual(null)
        expect(getRedirectUrl(getReqWithParam('redirectUrl', ''))).toEqual(null)
        expect(getRedirectUrl(getReqWithParam('redirectUrl', null))).toEqual(null)
        expect(getRedirectUrl(getReqWithParam('', ''))).toEqual(null)
        expect(getRedirectUrl(getReqWithParam('redirectUrl', encodeURIComponent(redirectUrl)))).toEqual(redirectUrl)
    })

    it('getUserType', async () => {
        expect(getUserType(getReqWithParam('', ''))).toEqual(null)
        expect(getUserType(getReqWithParam('userType', STAFF))).toEqual(STAFF)
        expect(getUserType({ ...getReqWithParam('', ''), query: { userType: STAFF } })).toEqual(STAFF)
        expect(getUserType(getReqWithParam('userType', 'wrongType'))).toEqual(null)
    })

    it('getBotId', async () => {
        const botId = faker.random.alphaNumeric(10)
        expect(getBotId({ params: { botId } })).toBe(null)
        expect(getBotId({ query: { botId } })).toBe(botId)
        expect(getBotId({})).toBe(null)
        expect(getBotId({ params: { botId: 'botIdFromParams' }, query: { botId: 'botIdFromQuery' } })).toBe('botIdFromQuery')
    })
})