const { createTestEmail } = require('@condo/domains/user/utils/testSchema')

const { GithubAuthStrategy } = require('./github')

const PRIMARY_VERIFIED_EMAIL = { verified: true, primary: true, value: createTestEmail() }
const VERIFIED_EMAIL = { verified: true, primary: false, value: createTestEmail() }
const PRIMARY_EMAIL = { verified: false, primary: true, value: createTestEmail() }
const UNVERIFIED_EMAIL = { verified: false, primary: false, value: createTestEmail() }

function _randInt (minNumber, maxNumber) {
    return Math.floor(Math.random() * (maxNumber - minNumber)) + minNumber
}

function _shuffle (arr) {
    const result = [...arr]
    for (let i = 0; i < arr.length; i++) {
        const rndIndex = _randInt(i, arr.length)
        const tmp = result[i]
        result[i] = result[rndIndex]
        result[rndIndex] = tmp
    }

    return result
}

describe('GithubAuthStrategy helper methods', () => {
    describe('GithubAuthStrategy.findValidEmail', () => {
        test('Must prioritize primary verified email', () => {
            expect(
                GithubAuthStrategy.findValidEmail(
                    _shuffle([PRIMARY_EMAIL, PRIMARY_VERIFIED_EMAIL, VERIFIED_EMAIL, UNVERIFIED_EMAIL])
                )
            ).toEqual(PRIMARY_VERIFIED_EMAIL)
        })
        test('Otherwise must prioritize any verified email', () => {
            expect(
                GithubAuthStrategy.findValidEmail(
                    _shuffle([PRIMARY_EMAIL, VERIFIED_EMAIL, UNVERIFIED_EMAIL])
                )
            ).toEqual(VERIFIED_EMAIL)
        })
        test('Otherwise must prioritize primary email', () => {
            expect(
                GithubAuthStrategy.findValidEmail(
                    _shuffle([PRIMARY_EMAIL, UNVERIFIED_EMAIL])
                )
            ).toEqual(PRIMARY_EMAIL)
        })
        test('Otherwise must return any email', () => {
            expect(
                GithubAuthStrategy.findValidEmail(
                    [UNVERIFIED_EMAIL]
                )
            ).toEqual(UNVERIFIED_EMAIL)
        })
        test('Should return undefined if no emails provided', () => {
            expect(
                GithubAuthStrategy.findValidEmail(
                    []
                )
            ).toEqual(undefined)
        })
    })
})