const { faker } = require('@faker-js/faker')
const jwt = require('jsonwebtoken')

const { SBER_ID_SESSION_KEY } = require('@condo/domains/user/constants/common')

const {
    validateState,
    validateNonce,
    hasSamePhone,
} = require('./validations')

const JWT_SECRET = faker.datatype.uuid()

const getReqWithSessionParam = (path, value) => {
    return {
        session: {
            [SBER_ID_SESSION_KEY]: {
                [path]: value,
            },
        },
        query: {},
    }
}
const getTokenSet = (nonce) => {
    return {
        idToken: jwt.sign({ nonce }, JWT_SECRET),
    }
}

describe('Sber id integration validations', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('validateState', () => {
        it('QP and session exists', async () => {
            const state = 'state'
            const req = getReqWithSessionParam('checks.state', state)
            req.query.state = state

            expect(() => validateState(req)).not.toThrowError()
        })

        it('QP empty and session exists', async () => {
            const state = 'state'
            const req = getReqWithSessionParam('checks.state', state)

            expect(() => validateState(req)).toThrowError()
        })

        it('QP empty and session empty', async () => {
            const req = getReqWithSessionParam('wrongPath', 'wrongState')
            expect(() => validateState(req)).not.toThrowError()
        })

        it('QP and session are different', async () => {
            const state = 'state'
            const req = getReqWithSessionParam('checks.state', 'differentState')
            req.query.state = state

            expect(() => validateState(req)).toThrowError()
        })
    })
    describe('validateNonce', () => {
        it('Token and session exists', async () => {
            const nonce = 'nonce'
            const req = getReqWithSessionParam('checks.nonce', nonce)
            const tokenSet = getTokenSet(nonce)

            expect(() => validateNonce(req, tokenSet)).not.toThrowError()
        })
        it('Token and QP exists', async () => {
            const nonce = 'nonce'
            const req = getReqWithSessionParam('wrongPath', nonce)
            req.query.nonce = nonce
            const tokenSet = getTokenSet(nonce)

            expect(() => validateNonce(req, tokenSet)).not.toThrowError()
        })

        it('No QP and no session', async () => {
            const nonce = 'nonce'
            const req = getReqWithSessionParam('wrongPath', nonce)
            const tokenSet = getTokenSet(nonce)

            expect(() => validateNonce(req, tokenSet)).not.toThrowError()
        })

        it('Token nonce and session are different', async () => {
            const nonce = 'nonce'
            const req = getReqWithSessionParam('checks.nonce', nonce)
            const tokenSet = getTokenSet('differentNonce')

            expect(() => validateNonce(req, tokenSet)).toThrowError()
        })
    })
    describe('hasSamePhone', () => {
        it('All cases', async () => {
            expect(hasSamePhone({ phone: '+79999999999' }, { phoneNumber: '+7 9999999999' })).toBeTruthy()
            expect(hasSamePhone({ phone: '+79999999999' }, { phoneNumber: '+7 (999) 9999999' })).toBeTruthy()
            expect(hasSamePhone({ phone: '+79999999999' }, { phoneNumber: '+7 (999) 999 99-99' })).toBeTruthy()
            expect(hasSamePhone({ phone: '+99999999999' }, { phoneNumber: '+7 (999) 999 99-99' })).not.toBeTruthy()
        })
    })
})