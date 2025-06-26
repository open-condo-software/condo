const { STAFF } = require('@condo/domains/user/constants/common')

const {
    getRedirectUrl,
    getUserType,
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
        expect(getRedirectUrl(getReqWithParam('redirectUrl', notSafeUrl))).toEqual('')
        expect(getRedirectUrl(getReqWithParam('redirectUrl', ''))).toEqual('')
        expect(getRedirectUrl(getReqWithParam('redirectUrl', null))).toEqual('')
        expect(getRedirectUrl(getReqWithParam('', ''))).toEqual('')
    })

    it('getUserType', async () => {
        expect(getUserType(getReqWithParam('', ''))).toEqual('')
        expect(getUserType(getReqWithParam('userType', STAFF))).toEqual(STAFF)
        expect(getUserType({ ...getReqWithParam('', ''), query: { userType: STAFF } })).toEqual(STAFF)
        expect(getUserType(getReqWithParam('userType', 'wrongType'))).toEqual('')
    })
})