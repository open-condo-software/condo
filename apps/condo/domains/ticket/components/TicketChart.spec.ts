import TicketChart, { ChartConfigMapType } from './TicketChart'

const CHART_RESULT_DATA = {
    axisData: { xAxis: { type: '', data: [] }, yAxis: { type: '', data: [] } },
    tooltip: { trigger: '', axisPointer: { type: '' } },
    series: [],
    legend: [],
}

const TABLE_RESULT_DATA = {
    dataSource: [],
    tableColumns: [],
}

const ANALYTICS_DATA = {
    group11: {
        group21: 1,
        group22: 0,
    },
    group12: {
        group21: 2,
        group22: 3,
    },
}

const TABLE_ADDITIONAL_DATA = {
    translations: {},
}

const TICKET_CHART_CONFIG: ChartConfigMapType = {
    bar: {
        chart: (viewMode, data) => CHART_RESULT_DATA,
        table: (viewMode, data, restTableOptions) => TABLE_RESULT_DATA,
    },
    line: {
        chart: (viewMode, data) => CHART_RESULT_DATA,
        table: (viewMode, data, restTableOptions) => TABLE_RESULT_DATA,
    },
}

describe('TicketChart', () => {
    describe('getting stored configs', () => {
        it('should be same type as base class', () => {
            const ticketChart = new TicketChart(TICKET_CHART_CONFIG)
            expect(ticketChart).toBeInstanceOf(TicketChart)
        })

        it('should return config for chart from getChartConfig method call', () => {
            const ticketChart = new TicketChart(TICKET_CHART_CONFIG)
            expect(ticketChart.getChartConfig('line', ANALYTICS_DATA)).toStrictEqual(CHART_RESULT_DATA)
        })

        it('should return config for table from getChartConfig method call', () => {
            const ticketChart = new TicketChart(TICKET_CHART_CONFIG)
            expect(ticketChart.getTableConfig('line', ANALYTICS_DATA, TABLE_ADDITIONAL_DATA)).toStrictEqual(TABLE_RESULT_DATA)
        })
    })
})
