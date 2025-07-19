const { faker } = require('@faker-js/faker')
const jwt = require('jsonwebtoken')

const { APPLE_ID_SESSION_KEY } = require('@condo/domains/user/constants/common')

const {
    validateState,
    validateNonce,
} = require('./validations')

const JWT_SECRET = faker.datatype.uuid()

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
const getTokenSet = (nonce) => {
    return {
        idToken: jwt.sign({ nonce }, JWT_SECRET),
    }
}

describe('Apple id integration validations', () => {
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
})