import crypto from 'crypto'

import { TicketAnalyticsGroupBy, TicketGroupedCounter } from '@app/condo/schema'
import dayjs, { Dayjs } from 'dayjs'

import {
    getAggregatedData,
    filterToQuery,
    ticketAnalyticsPageFilters,
    getChartOptions,
    isEmptyAnalyticsData,
} from './helpers'

describe('Helpers', () => {
    describe('queryUtils', () => {
        describe('filterToQuery',  () => {
            describe('it should correctly generate query if', () => {
                const property = {
                    id: crypto.randomBytes(64).toString('hex'),
                    value: 'property address',
                }
                const selectedRange: [Dayjs, Dayjs] = [dayjs().subtract(1, 'week').startOf('day'), dayjs().endOf('day')]

                it('filter contains property', () => {
                    const filter: ticketAnalyticsPageFilters = {
                        range: selectedRange,
                        addressList: [property],
                        specification: 'day',
                        responsibleList: [],
                        executorList: [],
                        classifierList: [],
                    }
                    const expectedResult = {
                        AND: [
                            { createdAt_gte: selectedRange[0].toISOString() },
                            { createdAt_lte: selectedRange[1].toISOString() },
                            { property: { id_in: [property.id] } },
                        ],
                        groupBy: ['status', 'day'],
                    }

                    expect(filterToQuery({
                        filter, viewMode: 'line', ticketType: 'all', mainGroup: 'status',
                    })).toStrictEqual(expectedResult)
                })

                it('filter not contains property', () => {
                    const filter: ticketAnalyticsPageFilters = {
                        range: selectedRange,
                        specification: 'day',
                        addressList: [],
                        classifierList: [],
                        executorList: [],
                        responsibleList: [],
                    }
                    const expectedResult = {
                        AND: [
                            { createdAt_gte: selectedRange[0].toISOString() },
                            { createdAt_lte: selectedRange[1].toISOString() },
                        ],
                        groupBy: ['status', 'day'],
                    }
                    expect(filterToQuery({
                        filter, viewMode: 'line', ticketType: 'all', mainGroup: 'status' })
                    ).toStrictEqual(expectedResult)
                })

                it('filter with emergency ticket type',  () => {
                    const filter: ticketAnalyticsPageFilters = {
                        range: selectedRange,
                        specification: 'day',
                        addressList: [],
                        responsibleList: [],
                        executorList: [],
                        classifierList: [],
                    }
                    const expectedResult = {
                        AND: [
                            { createdAt_gte: selectedRange[0].toISOString() },
                            { createdAt_lte: selectedRange[1].toISOString() },
                            { isEmergency: true },
                            { isWarranty: false },
                            { isPayable: false },
                        ],
                        groupBy: ['status', 'day'],
                    }
                    expect(filterToQuery({
                        filter, viewMode: 'line', ticketType: 'emergency', mainGroup: 'status' })
                    ).toStrictEqual(expectedResult)
                })

                it('filter with warranty ticket type',  () => {
                    const filter: ticketAnalyticsPageFilters = {
                        range: selectedRange,
                        specification: 'day',
                        addressList: [],
                        responsibleList: [],
                        executorList: [],
                        classifierList: [],
                    }
                    const expectedResult = {
                        AND: [
                            { createdAt_gte: selectedRange[0].toISOString() },
                            { createdAt_lte: selectedRange[1].toISOString() },
                            { isEmergency: false },
                            { isWarranty: true },
                            { isPayable: false },
                        ],
                        groupBy: ['status', 'day'],
                    }
                    expect(filterToQuery({
                        filter, viewMode: 'line', ticketType: 'warranty', mainGroup: 'status' })
                    ).toStrictEqual(expectedResult)
                })

                it('filter with payable ticket type',  () => {
                    const filter: ticketAnalyticsPageFilters = {
                        range: selectedRange,
                        specification: 'day',
                        addressList: [],
                        classifierList: [],
                        executorList: [],
                        responsibleList: [],
                    }
                    const expectedResult = {
                        AND: [
                            { createdAt_gte: selectedRange[0].toISOString() },
                            { createdAt_lte: selectedRange[1].toISOString() },
                            { isEmergency: false },
                            { isWarranty: false },
                            { isPayable: true },
                        ],
                        groupBy: ['status', 'day'],
                    }
                    const dataToCheck = filterToQuery({
                        filter, viewMode: 'line', ticketType: 'payable', mainGroup: 'status',
                    })
                    expect(dataToCheck).toStrictEqual(expectedResult)
                })
            })
        })
    })

    describe('analyticsUtils', () => {
        describe('getAggregateData', () => {
            describe('it should correctly generate output object if', () => {
                const dates = [dayjs().subtract(1, 'day').format('DD.MM.YYYY'), dayjs().format('DD.MM.YYYY')]
                const ticketGroupedCounter: TicketGroupedCounter[] = [
                    { status: 'open', count: 1, property: 'property1', dayGroup: dates[1] },
                    { status: 'closed', count: 3, property: 'property1', dayGroup: dates[1] },
                    { status: 'open', count: 2, property: 'property2', dayGroup: dates[0] }
                    ,
                    { status: 'closed', count: 1, property: 'property2', dayGroup: dates[0] },
                ]
                it('groupBy dependencies contains day group', () => {
                    const groupBy = ['status', 'day'] as TicketAnalyticsGroupBy[]
                    const data = getAggregatedData(ticketGroupedCounter, groupBy)
                    expect(data).toMatchObject({
                        open: { [dates[1]]: 1, [dates[0]]: 2 },
                        closed: { [dates[0]]: 1, [dates[1]]: 3 },
                    })
                })

                it('groupBy dependencies contains week group', () => {
                    const groupBy = ['status', 'week'] as TicketAnalyticsGroupBy[]
                    const data = getAggregatedData(ticketGroupedCounter, groupBy)
                    expect(data).toMatchObject({
                        open: { [dates[1]]: 1, [dates[0]]: 2 },
                        closed: { [dates[0]]: 1, [dates[1]]: 3 },
                    })
                })

                it('groupBy dependencies contains property', () => {
                    const groupBy = ['status', 'property'] as TicketAnalyticsGroupBy[]
                    const data = getAggregatedData(ticketGroupedCounter, groupBy)
                    expect(data).toMatchObject({
                        open: { property1: 1, property2: 2 },
                        closed: { property1: 3, property2: 1 },
                    })
                })

                it('groupBy dependencies equal ["property", "status"]', () => {
                    const groupBy = ['property', 'status'] as TicketAnalyticsGroupBy[]
                    const data = getAggregatedData(ticketGroupedCounter, groupBy)
                    expect(data).toMatchObject(    {
                        property1: { open: 1, closed: 3 },
                        property2: { open: 2, closed: 1 },
                    })
                })

                it('receive non enumerable prop injectSummaryInfo', () => {
                    const groupBy = ['status', 'property'] as TicketAnalyticsGroupBy[]
                    const data = getAggregatedData(ticketGroupedCounter, groupBy, true)
                    expect(data).toMatchObject({
                        open: { property1: 1, property2: 2 },
                        closed: { property1: 3, property2: 1 },
                    })
                    expect(data).toHaveProperty('summary')
                    expect(data.summary).toMatchObject({ property1: 4, property2: 3 })
                })

                it('not receive injectSummaryInfo by default', () => {
                    const groupBy = ['status', 'property'] as TicketAnalyticsGroupBy[]
                    const data = getAggregatedData(ticketGroupedCounter, groupBy)
                    expect(data).toMatchObject({
                        open: { property1: 1, property2: 2 },
                        closed: { property1: 3, property2: 1 },
                    })
                    expect(data).not.toHaveProperty('summary')
                })
            })
        })

        describe('getChartOptions', () => {
            describe('it should correctly generate chart options if', () => {
                const color = ['#fff', '#000']
                const axisData = {
                    xAxis: {
                        type: 'unset',
                        data: null,
                    },
                    yAxis: {
                        type: 'unset',
                        data: null,
                    },
                }
                const tooltip = { trigger: 'none', axisPointer: { type: 'none' } }
                it('chart type is bar', () => {
                    const { option, opts } = getChartOptions({
                        viewMode: 'bar',
                        series: [{
                            data: [1, 2],
                            type: 'bar',
                        }],
                        axisData,
                        tooltip,
                        animationEnabled: false,
                        chartOptions: { renderer: 'svg' },
                        legend: ['label1', 'label2'],
                        color,
                    })

                    expect(opts).toMatchObject({ renderer: 'svg', height: 'auto' })
                    expect(Object.keys(option).sort()).toEqual([
                        'animation', 'color', 'grid', 'legend', 'series', 'tooltip', 'xAxis', 'yAxis',
                    ])
                    expect(option.legend.data).toEqual(['label1', 'label2'])
                    expect(option.series).toHaveLength(1)
                    expect(option.series[0].data).toEqual([1, 2])
                })

                it('chart type is line', () => {
                    const { option, opts } = getChartOptions({
                        viewMode: 'line',
                        series: [{
                            data: [1, 2],
                            type: 'line',
                        }],
                        axisData,
                        tooltip,
                        animationEnabled: false,
                        chartOptions: { height: 200 },
                        legend: ['label1', 'label2'],
                        color,
                    })
                    expect(opts).toMatchObject({  height: 200, renderer: 'svg' })
                    expect(Object.keys(option).sort()).toEqual([
                        'animation', 'color', 'grid', 'legend', 'series', 'tooltip', 'xAxis', 'yAxis',
                    ])
                    expect(option.series).toHaveLength(1)
                    expect(option.series[0].type).toEqual('line')
                })

                it('chart type is pie', () => {
                    const { option, opts } = getChartOptions({
                        viewMode: 'pie',
                        series: [{
                            data: [1, 2],
                            type: 'pie',
                            name: 'pie chart name',

                        }],
                        tooltip,
                        animationEnabled: false,
                        chartOptions: { height: 'auto' },
                        legend: ['label1', 'label2'],
                        color,
                    })

                    expect(opts).toMatchObject({ height: 'auto', renderer: 'svg' })
                    expect(Object.keys(option).sort()).toEqual([
                        'animation', 'color', 'grid', 'legend', 'series', 'title', 'tooltip',
                    ])
                })
            })
        })
    })

    describe('isEmptyAnalyticsData', () => {
        describe('cases when true is returned', () => {
            it('should return true if analyticsData is empty object', () => {
                const analyticsData = []
                const isNoAnalyticsData = isEmptyAnalyticsData(analyticsData)
                expect(isNoAnalyticsData).toEqual(true)
            })

            it('should return true the first time the page is rendered', () => {
                const analyticsData = null
                const isNoAnalyticsData = isEmptyAnalyticsData(analyticsData)
                expect(isNoAnalyticsData).toEqual(true)
            })

            it('should return true if analyticsData is undefined', () => {
                const analyticsData = undefined
                const isNoAnalyticsData = isEmptyAnalyticsData(analyticsData)
                expect(isNoAnalyticsData).toEqual(true)
            })

            it('should return true if there are no tickets on the selected date', () => {
                const analyticsData = [{
                    count:0,
                }]
                const isNoAnalyticsData = isEmptyAnalyticsData(analyticsData)
                expect(isNoAnalyticsData).toEqual(true)
            })
        })
        describe('cases when false is returned', () => {
            it('should return false if there is at least 1 ticket in the selected date', () => {
                const analyticsData = [{
                    count:1,
                }]
                const isNoAnalyticsData = isEmptyAnalyticsData(analyticsData)
                expect(isNoAnalyticsData).toEqual(false)
            })
        })
    })
})
