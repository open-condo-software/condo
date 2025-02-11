const { STAFF, RESIDENT } = require('@condo/domains/user/constants/common')
const { getUserType } = require('@condo/domains/user/integration/telegram/utils')

describe('TelegramUtils', () => {
    describe('getUserType', () => {

        test('should return default RESIDENT if userType is not provided', () => {
            const req = {
                query: {},
            }
            const type = getUserType(req)
            expect(type).toEqual(RESIDENT)
        })

        test('should return the correct type for a valid userType', () => {
            const req = {
                query: {
                    userType: STAFF,
                },
            }
            const type = getUserType(req)
            expect(type).toEqual(STAFF)
        })

        test('should throw an error for an invalid userType', () => {
            const req = {
                query: {
                    userType: 'not-existing',
                },
            }
            expect(() => getUserType(req)).toThrowError('userType is incorrect')
        })
    })
})
