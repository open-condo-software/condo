const { RESIDENT, STAFF, APPLE_ID_SESSION_KEY } = require('@condo/domains/user/constants/common')

const {
    getRedirectUrl,
    getUserType,
    getSessionParam,
} = require('./params')

const getReqWithSessionParam = (path, value) => {
    return {
        session: {
            [APPLE_ID_SESSION_KEY]: {
                [path]: value,
            },
        },
        query: {},
    }
}

describe('Apple id integration params utils', () => {
    it('getSessionParam', async () => {
        expect(getSessionParam(getReqWithSessionParam('test', 'value'), 'test'))
            .toEqual('value')
        expect(getSessionParam(getReqWithSessionParam('test', 'value'), 'notExistsPath'))
            .not.toBeTruthy()
    })

    it('getRedirectUrl', async () => {
        const redirectUrl = 'http://localhost:3000'
        const notSafeUrl = 'http://localhost:3000?javascript:alert(document.cookie)'

        expect(getRedirectUrl(getReqWithSessionParam('redirectUrl', redirectUrl)))
            .toEqual(redirectUrl)
        expect(getRedirectUrl({ ...getReqWithSessionParam('', ''), query: { redirectUrl } }))
            .toEqual(redirectUrl)
        expect(() => getRedirectUrl(getReqWithSessionParam('redirectUrl', notSafeUrl)))
            .toThrowError()
        expect(getRedirectUrl(getReqWithSessionParam('redirectUrl', ''))).not.toBeTruthy()
        expect(getRedirectUrl(getReqWithSessionParam('redirectUrl', null))).not.toBeTruthy()
        expect(getRedirectUrl(getReqWithSessionParam('', ''))).not.toBeTruthy()
    })

    it('getUserType', async () => {
        expect(getUserType(getReqWithSessionParam('', '')))
            .toEqual(RESIDENT)
        expect(getUserType(getReqWithSessionParam('userType', STAFF)))
            .toEqual(STAFF)
        expect(getUserType({ ...getReqWithSessionParam('', ''), query: { userType: STAFF } }))
            .toEqual(STAFF)
        expect(() => getUserType(getReqWithSessionParam('userType', 'wrongType')))
            .toThrowError()
    })
})