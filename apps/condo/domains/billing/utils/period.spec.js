const { getPreviousPeriods } = require('./period')

describe('period utils test', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('getPreviousPeriods', () => {
        describe('should return []', () => {
            it('if no parameters specified', () => {
                expect(getPreviousPeriods()).toStrictEqual([])
            })
            it('if no correct date passed', () => {
                expect(getPreviousPeriods('failed')).toStrictEqual([])
            })
            it('if amount < 1 passed', () => {
                expect(getPreviousPeriods('2021-08-01', 0)).toStrictEqual([])
            })
        })
        describe('should generate correct periods', () => {
            const startPeriod = '2021-03-01'
            it('in single year', () => {
                const expectedResult = ['2021-03-01', '2021-02-01', '2021-01-01']
                expect(getPreviousPeriods(startPeriod)).toStrictEqual(expectedResult)
            })
            it('in this and previous year', () => {
                const expectedResult = [
                    '2021-03-01',
                    '2021-02-01',
                    '2021-01-01',
                    '2020-12-01',
                    '2020-11-01',
                ]
                expect(getPreviousPeriods(startPeriod, 5)).toStrictEqual(expectedResult)
            })
            it('in multiple year', () => {
                const expectedResult =  [
                    '2021-03-01',
                    '2021-02-01',
                    '2021-01-01',
                    '2020-12-01',
                    '2020-11-01',
                    '2020-10-01',
                    '2020-09-01',
                    '2020-08-01',
                    '2020-07-01',
                    '2020-06-01',
                    '2020-05-01',
                    '2020-04-01',
                    '2020-03-01',
                    '2020-02-01',
                    '2020-01-01',
                    '2019-12-01',
                    '2019-11-01',
                ]
                expect(getPreviousPeriods(startPeriod, 17)).toStrictEqual(expectedResult)
            })
        })
    })
})