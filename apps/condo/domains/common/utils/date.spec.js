import { getMonthStart, getStartDates } from './date'

describe('Date helper tests', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('getMonthStart', () => {
        it('returns properly formatted correct date value', () => {
            const thisMonthStart = new Date().toISOString().slice(0, 7) + '-01'

            expect(getMonthStart('2022-04-18', true)).toStrictEqual('2022-04-01')
            expect(getMonthStart(undefined, true)).toStrictEqual(thisMonthStart)
        })
    })

    describe('getStartDates', () => {
        it('returns properly formatted correct date values for prev, current and next month start', () => {
            const { prevMonthStart, thisMonthStart, nextMonthStart } = getStartDates('2022-05-17')

            expect(prevMonthStart).toStrictEqual('2022-04-01')
            expect(thisMonthStart).toStrictEqual('2022-05-01')
            expect(nextMonthStart).toStrictEqual('2022-06-01')
        })

        it('returns properly formatted correct date values for prev, current and next month start for december', () => {
            const { prevMonthStart, thisMonthStart, nextMonthStart } = getStartDates('2022-12-17')

            expect(prevMonthStart).toStrictEqual('2022-11-01')
            expect(thisMonthStart).toStrictEqual('2022-12-01')
            expect(nextMonthStart).toStrictEqual('2023-01-01')
        })

        it('returns properly formatted correct date values for prev, current and next month start for january', () => {
            const { prevMonthStart, thisMonthStart, nextMonthStart } = getStartDates('2022-01-17')

            expect(prevMonthStart).toStrictEqual('2021-12-01')
            expect(thisMonthStart).toStrictEqual('2022-01-01')
            expect(nextMonthStart).toStrictEqual('2022-02-01')
        })
    })
})
