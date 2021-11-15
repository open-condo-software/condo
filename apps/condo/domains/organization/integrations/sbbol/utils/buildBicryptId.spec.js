// NOTE: To avoid an error "Cannot access 'mockLoggerError' before initialization, any function mock
// should be instantiated before any module import
const mockLoggerError = jest.fn()

const { buildBicryptId } = require('./buildBicryptId')
const { catchSyncErrorFrom } = require('../../../../common/utils/testSchema')

jest.mock('../common', () => ({
    logger: {
        child: () => ({
            error: mockLoggerError,
        }),
    },
}))

// NOTE: Despite of We should still use `async` function,
const checkValidationAgainstIncorrectValue = (field, invalidValue, errorFields) => {
    mockLoggerError.mockClear()
    const cryptoInfo = {
        firstName: 'Ivan',
        lastName: 'Ivanov',
        patronymic: 'Ivanovich',
        certCenterCode: '09AZ',
        certCenterNum: '01',
    }
    cryptoInfo[field] = invalidValue
    catchSyncErrorFrom(() => {
        buildBicryptId(cryptoInfo)
    }, e => {
        expect(e.message).toBe('Wrong format of arguments, passed to `buildBicryptId` function')
        expect(mockLoggerError).toBeCalledTimes(1)
        expect(mockLoggerError).toHaveBeenCalledWith('Wrong format of arguments', {
            cryptoInfo,
            errors: [errorFields],
        })
    })
}

describe('buildBicryptId', () => {
    it('throws error if `certCenterNum` argument has incorrect value or is not specified', () => {
        checkValidationAgainstIncorrectValue('certCenterNum', null, {
            instancePath: '/certCenterNum',
            message: 'must be string',
        })
        checkValidationAgainstIncorrectValue('certCenterNum', '', {
            instancePath: '/certCenterNum',
            message: 'must match pattern "^[0-9A-Z]{2}$"',
        })
        checkValidationAgainstIncorrectValue('certCenterNum', undefined, {
            instancePath: '',
            message: 'must have required property \'certCenterNum\'',
        })
    })

    it('throws error if `certCenterNum` argument has incorrect value format', () => {
        const incorrectValues = [
            '0', '9', 'A', 'Z',
            '0.', '9-', 'A_', 'Z!',
            '000', 'AAA', '010', '01A', 'A01',
            '.', '-', '_', '!',
        ]
        incorrectValues.map(incorrectValue => {
            checkValidationAgainstIncorrectValue('certCenterNum', incorrectValue, {
                instancePath: '/certCenterNum',
                message: 'must match pattern "^[0-9A-Z]{2}$"',
            })
        })
    })

    it('throws error if `certCenterCode` argument is null', () => {
        checkValidationAgainstIncorrectValue('certCenterCode', null, {
            instancePath: '/certCenterCode',
            message: 'must be string',
        })
        checkValidationAgainstIncorrectValue('certCenterCode', '', {
            instancePath: '/certCenterCode',
            message: 'must match pattern "^(?:[0-9A-Z]{4}|[0-9A-Z]{6})$"',
        })
        checkValidationAgainstIncorrectValue('certCenterCode', undefined, {
            instancePath: '',
            message: 'must have required property \'certCenterCode\'',
        })
    })

    it('throws error if `certCenterCode` argument has incorrect length', () => {
        const incorrectValues = ['0', '01', '012', '01234', '0123456']
        incorrectValues.map(incorrectValue => {
            checkValidationAgainstIncorrectValue('certCenterCode', incorrectValue, {
                instancePath: '/certCenterCode',
                message: 'must match pattern "^(?:[0-9A-Z]{4}|[0-9A-Z]{6})$"',
            })
        })
    })

    it('throws error if `firstName` argument is not specified', () => {
        checkValidationAgainstIncorrectValue('firstName', null, {
            instancePath: '/firstName',
            message: 'must be string',
        })
        checkValidationAgainstIncorrectValue('firstName', '', {
            instancePath: '/firstName',
            message: 'must NOT have fewer than 1 characters',
        })
        checkValidationAgainstIncorrectValue('firstName', undefined, {
            instancePath: '',
            message: 'must have required property \'firstName\'',
        })
    })

    it('throws error if `lastName` argument is not specified', async () => {
        checkValidationAgainstIncorrectValue('lastName', null, {
            instancePath: '/lastName',
            message: 'must be string',
        })
        checkValidationAgainstIncorrectValue('lastName', '', {
            instancePath: '/lastName',
            message: 'must NOT have fewer than 1 characters',
        })
        checkValidationAgainstIncorrectValue('lastName', undefined, {
            instancePath: '',
            message: 'must have required property \'lastName\'',
        })
    })

    it('throws error if `patronymic` argument is not specified', () => {
        checkValidationAgainstIncorrectValue('patronymic', null, {
            instancePath: '/patronymic',
            message: 'must be string',
        })
        checkValidationAgainstIncorrectValue('patronymic', '', {
            instancePath: '/patronymic',
            message: 'must NOT have fewer than 1 characters',
        })
        checkValidationAgainstIncorrectValue('patronymic', undefined, {
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
