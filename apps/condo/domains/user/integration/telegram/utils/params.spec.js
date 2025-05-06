const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')

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

        expect(getRedirectUrl(getReqWithParam('redirectUrl', redirectUrl)))
            .toEqual(redirectUrl)
        expect(getRedirectUrl({ ...getReqWithParam('', ''), query: { redirectUrl } }))
            .toEqual(redirectUrl)
        expect(() => getRedirectUrl(getReqWithParam('redirectUrl', notSafeUrl)))
            .toThrowError()
        expect(getRedirectUrl(getReqWithParam('redirectUrl', ''))).not.toBeTruthy()
        expect(getRedirectUrl(getReqWithParam('redirectUrl', null))).not.toBeTruthy()
        expect(getRedirectUrl(getReqWithParam('', ''))).not.toBeTruthy()
    })

    it('getUserType', async () => {
        expect(getUserType(getReqWithParam('', '')))
            .toEqual(RESIDENT)
        expect(getUserType(getReqWithParam('userType', STAFF)))
            .toEqual(STAFF)
        expect(getUserType({ ...getReqWithParam('', ''), query: { userType: STAFF } }))
            .toEqual(STAFF)
        expect(() => getUserType(getReqWithParam('userType', 'wrongType')))
            .toThrowError()
    })
})