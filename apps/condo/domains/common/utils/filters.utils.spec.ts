import dayjs from 'dayjs'

import { ComponentType, getQueryToValueProcessorByType } from './filters.utils'

describe('Filter utils', () => {
    describe('getQueryToValueProcessorByType', () => {
        it('should return right queryToDateProcessor', () => {
            const queryToDateProcessor = getQueryToValueProcessorByType(ComponentType.Date)
            const date = queryToDateProcessor(dayjs().toISOString())

            expect(date instanceof dayjs).toBeTruthy()
        })

        it('should return right queryToDateRangeProcessor', () => {
            const queryToDateRangeProcessor = getQueryToValueProcessorByType(ComponentType.DateRange)
            const [startDate, endDate] = queryToDateRangeProcessor([dayjs().toISOString(), dayjs().toISOString()])

            expect(startDate instanceof dayjs).toBeTruthy()
            expect(endDate instanceof dayjs).toBeTruthy()
        })

        it('should return no processor on Input type component', () => {
            const processor = getQueryToValueProcessorByType(ComponentType.Input)

            expect(processor).toBeUndefined()
        })
    })
})