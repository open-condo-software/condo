// NOTE: To avoid an error "Cannot access 'mockLoggerError' before initialization, any function mock
// should be instantiated before any module import
const mockLoggerError = jest.fn()

const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { buildBicryptId } = require('./buildBicryptId')

jest.mock('@open-condo/keystone/logging', () => {
    return {
        getLogger: () => { return { error: mockLoggerError }},
    }
})

// NOTE: Despite of We should still use `async` function,
const checkValidationAgainstIncorrectValue = async (field, invalidValue, errorFields) => {
    mockLoggerError.mockClear()
    const cryptoInfo = {
        firstName: 'Ivan',
        lastName: 'Ivanov',
        patronymic: 'Ivanovich',
        certCenterCode: '09AZ',
        certCenterNum: '01',
        [field]: invalidValue,
    }
    await catchErrorFrom(async () => {
        buildBicryptId(cryptoInfo)
    }, e => {
        expect(e.message).toBe('Wrong format of arguments, passed to `buildBicryptId` function')
        expect(mockLoggerError).toBeCalledTimes(1)
        expect(mockLoggerError).toHaveBeenCalledWith({
            msg: 'wrong format of arguments',
            data: {
                cryptoInfo,
                errors: [errorFields],
            },
        })
    })
}

describe('buildBicryptId', () => {
    it('throws error if `certCenterNum` argument has incorrect value or is not specified', async () => {
        await checkValidationAgainstIncorrectValue('certCenterNum', null, {
            instancePath: '/certCenterNum',
            message: 'must be string',
        })
        await checkValidationAgainstIncorrectValue('certCenterNum', '', {
            instancePath: '/certCenterNum',
            message: 'must match pattern "^[0-9A-Z]{2}$"',
        })
        await checkValidationAgainstIncorrectValue('certCenterNum', undefined, {
            instancePath: '',
            message: 'must have required property \'certCenterNum\'',
        })
    })

    it('throws error if `certCenterNum` argument has incorrect value format', async () => {
        const incorrectValues = [
            '0', '9', 'A', 'Z',
            '0.', '9-', 'A_', 'Z!',
            '000', 'AAA', '010', '01A', 'A01',
            '.', '-', '_', '!',
        ]
        for (const incorrectValue of incorrectValues) {
            await checkValidationAgainstIncorrectValue('certCenterNum', incorrectValue, {
                instancePath: '/certCenterNum',
                message: 'must match pattern "^[0-9A-Z]{2}$"',
            })
        }
    })

    it('throws error if `certCenterCode` argument is null', async () => {
        await checkValidationAgainstIncorrectValue('certCenterCode', null, {
            instancePath: '/certCenterCode',
            message: 'must be string',
        })
        await checkValidationAgainstIncorrectValue('certCenterCode', '', {
            instancePath: '/certCenterCode',
            message: 'must match pattern "^(?:[0-9A-Z]{4}|[0-9A-Z]{6})$"',
        })
        await checkValidationAgainstIncorrectValue('certCenterCode', undefined, {
            instancePath: '',
            message: 'must have required property \'certCenterCode\'',
        })
    })

    it('throws error if `certCenterCode` argument has incorrect length', async () => {
        const incorrectValues = ['0', '01', '012', '01234', '0123456']
        for (const incorrectValue of incorrectValues) {
            await checkValidationAgainstIncorrectValue('certCenterCode', incorrectValue, {
                instancePath: '/certCenterCode',
                message: 'must match pattern "^(?:[0-9A-Z]{4}|[0-9A-Z]{6})$"',
            })
        }
    })

    it('throws error if `firstName` argument is not specified', async () => {
        await checkValidationAgainstIncorrectValue('firstName', null, {
            instancePath: '/firstName',
            message: 'must be string',
        })
        await checkValidationAgainstIncorrectValue('firstName', '', {
            instancePath: '/firstName',
            message: 'must NOT have fewer than 1 characters',
        })
        await checkValidationAgainstIncorrectValue('firstName', undefined, {
            instancePath: '',
            message: 'must have required property \'firstName\'',
        })
    })

    it('throws error if `lastName` argument is not specified', async () => {
        await checkValidationAgainstIncorrectValue('lastName', null, {
            instancePath: '/lastName',
            message: 'must be string',
        })
        await checkValidationAgainstIncorrectValue('lastName', '', {
            instancePath: '/lastName',
            message: 'must NOT have fewer than 1 characters',
        })
        await checkValidationAgainstIncorrectValue('lastName', undefined, {
            instancePath: '',
            message: 'must have required property \'lastName\'',
        })
    })

    it('throws error if `patronymic` argument is not specified', async () => {
        await checkValidationAgainstIncorrectValue('patronymic', null, {
            instancePath: '/patronymic',
            message: 'must be string',
        })
        await checkValidationAgainstIncorrectValue('patronymic', '', {
            instancePath: '/patronymic',
            message: 'must NOT have fewer than 1 characters',
        })
        await checkValidationAgainstIncorrectValue('patronymic', undefined, {
            instancePath: '',
            message: 'must have required property \'patronymic\'',
        })
    })

    it('builds identifier with provided 4-digit `certCenterCode` argument', () => {
        const result = buildBicryptId({
            certCenterCode: '09AZ',
            certCenterNum: '01',
            firstName: 'Ivan',
            lastName: 'Ivanov',
            patronymic: 'Ivanovich',
        })
        expect(result).toEqual('09AZ0001sIvanovII')
    })

    it('builds identifier with provided 6-digit `certCenterCode` argument', () => {
        const result = buildBicryptId({
            certCenterCode: '0123AZ',
            certCenterNum: '01',
            firstName: 'Ivan',
            lastName: 'Ivanov',
            patronymic: 'Ivanovich',
        })
        expect(result).toEqual('0123AZ01sIvanovII')
    })
})
