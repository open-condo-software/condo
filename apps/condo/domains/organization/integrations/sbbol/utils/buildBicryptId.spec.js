const { buildBicryptId } = require('./buildBicryptId')

describe('buildBicryptId', () => {
    it('throws error if `certCenterNum` argument is not specified', () => {
        const incorrectValues = [null, undefined, '']
        incorrectValues.map(incorrectValue => {
            expect(() => {
                buildBicryptId({
                    certCenterCode: '09AZ',
                    certCenterNum: incorrectValue,
                })
            }).toThrow('certCenterNum is not specified')
        })
    })

    it('throws error if `certCenterNum` argument has incorrect value', () => {
        const incorrectValues = [
            '0', '9', 'A', 'Z',
            '0.', '9-', 'A_', 'Z!',
            '000', 'AAA', '010', '01A', 'A01',
            '.', '-', '_', '!',
        ]
        incorrectValues.map(incorrectValue => {
            expect(() => {
                buildBicryptId({
                    certCenterCode: '09AZ',
                    certCenterNum: incorrectValue,
                })
            }).toThrow('certCenterNum has invalid format')
        })
    })

    it('throws error if `certCenterCode` argument is null', () => {
        const incorrectValues = [null, undefined, '']
        incorrectValues.map(incorrectValue => {
            expect(() => {
                buildBicryptId({
                    certCenterCode: incorrectValue
                })
            }).toThrow('certCenterCode is not specified')
        })
    })

    it('throws error if `certCenterCode` argument has incorrect length', () => {
        const incorrectValues = ['0', '01', '012', '01234', '0123456']
        incorrectValues.map(incorrectValue => {
            expect(() => {
                buildBicryptId({ certCenterCode: incorrectValue })
            }).toThrow('certCenterCode has incorrect length')
        })
    })

    it('throws error if `firstName` argument is not specified', () => {
        const incorrectValues = [null, undefined, '']
        incorrectValues.map(incorrectValue => {
            expect(() => {
                buildBicryptId({
                    certCenterCode: '09AZ',
                    certCenterNum: '01',
                    firstName: incorrectValue,
                    lastName: 'Ivanov',
                    patronymic: 'Ivanovich',
                })
            }).toThrow('firstName is not specified')

        })
    })

    it('throws error if `lastName` argument is not specified', () => {
        const incorrectValues = [null, undefined, '']
        incorrectValues.map(incorrectValue => {
            expect(() => {
                buildBicryptId({
                    certCenterCode: '09AZ',
                    certCenterNum: '01',
                    firstName: 'Ivan',
                    lastName: incorrectValue,
                    patronymic: 'Ivanovich',
                })
            }).toThrow('lastName is not specified')
        })
    })

    it('throws error if `patronymic` argument is not specified', () => {
        const incorrectValues = [null, undefined, '']
        incorrectValues.map(incorrectValue => {
            expect(() => {
                buildBicryptId({
                    certCenterCode: '09AZ',
                    certCenterNum: '01',
                    firstName: 'Ivan',
                    lastName: 'Ivanov',
                    patronymic: incorrectValue,
                })
            }).toThrow('patronymic is not specified')
        })
    })

    it('builds identifier with provided 4-digit `certCenterCode` argument', () => {
        const result = buildBicryptId({
            certCenterCode: '09AZ',
            certCenterNum: '01',
            firstName: 'Ivan',
            lastName: 'Ivanov',
            patronymic: 'Ivanovich'
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
