import { fitChartOption, parseChartOption } from './fitChartOption'

const NARROW = 320
const WIDE = 600
const BASE_HEIGHT = 300

const pieOption = {
    legend: { orient: 'vertical', right: 0, top: 'middle' },
    series: [{ type: 'pie', data: [{ name: 'Открыта', value: 1 }, { name: 'В работе', value: 2 }, { name: 'Закрыта', value: 3 }] }],
}

const barOption = {
    tooltip: {},
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: ['Очень длинное название категории'] },
    series: [{ type: 'bar', name: 'Заявки', data: [5] }],
}

const fit = (value: unknown, width: number) => {
    const option = parseChartOption(value)
    if (!option) throw new Error('option expected')
    return fitChartOption(option, width, BASE_HEIGHT)
}

describe('parseChartOption', () => {
    it('rejects a value that is not an object', () => {
        expect(parseChartOption(null)).toBeNull()
        expect(parseChartOption('chart')).toBeNull()
        expect(parseChartOption([])).toBeNull()
    })

    it('turns a single series object into a list and drops non-object items', () => {
        expect(parseChartOption({ series: { type: 'bar' } })?.series).toEqual([{ type: 'bar' }])
        expect(parseChartOption({ series: [{ type: 'line' }, 'junk', null] })?.series).toEqual([{ type: 'line' }])
        expect(parseChartOption({})?.series).toEqual([])
    })
})

describe('fitChartOption', () => {
    describe('legend', () => {
        it('stacks one entry per row and grows the chart on a narrow host', () => {
            const { option, height } = fit(pieOption, NARROW)

            expect(height).toBe(BASE_HEIGHT + 3 * 22)
            expect(option.legend).toEqual(expect.objectContaining({ type: 'plain', orient: 'vertical', left: 0, bottom: 0 }))
            expect(option.legend).not.toHaveProperty('top')
            expect(option.legend).not.toHaveProperty('right')
            expect(option.legend.textStyle).toEqual(expect.objectContaining({ width: NARROW - 28, overflow: 'truncate' }))
            expect(option.grid.bottom).toBe(8 + 3 * 22)
        })

        it('puts all entries in one row on a wide host', () => {
            const { option, height } = fit(pieOption, WIDE)

            expect(height).toBe(BASE_HEIGHT + 22)
            expect(option.legend).toEqual(expect.objectContaining({ orient: 'horizontal', width: WIDE }))
            expect(option.legend.textStyle).toEqual({})
        })

        it('counts legend rows from series names when there is no pie', () => {
            const value = { legend: {}, series: [{ type: 'line', name: 'A' }, { type: 'line', name: 'B' }, { type: 'line' }] }

            expect(fit(value, NARROW).height).toBe(BASE_HEIGHT + 2 * 22)
        })

        it('leaves a hidden legend alone and adds no height', () => {
            const value = { ...pieOption, legend: { show: false, top: 5 } }
            const { option, height } = fit(value, NARROW)

            expect(option.legend).toEqual({ show: false, top: 5 })
            expect(height).toBe(BASE_HEIGHT)
        })

        it('treats an unmeasured host as narrow', () => {
            expect(fit(pieOption, 0).option.legend.orient).toBe('vertical')
        })
    })

    describe('pie', () => {
        it('hides callouts on a narrow host and centers the pie above the legend', () => {
            const [pie] = fit(pieOption, NARROW).option.series

            expect(pie.label.show).toBe(false)
            expect(pie.labelLine.show).toBe(false)
            expect(pie).not.toHaveProperty('radius')
            expect(pie.center).toEqual(['50%', `${Math.round(150 / 366 * 100)}%`])
        })

        it('shows callouts with a smaller radius on a wide host', () => {
            const [pie] = fit(pieOption, WIDE).option.series

            expect(pie.label.show).toBe(true)
            expect(pie.labelLine.show).toBe(true)
            expect(pie.radius).toBe('46%')
        })
    })

    describe('bar', () => {
        it('colors each bar of a lone series and keeps an explicit colorBy', () => {
            expect(fit(barOption, NARROW).option.series[0].colorBy).toBe('data')

            const explicit = { ...barOption, series: [{ type: 'bar', colorBy: 'series' }] }
            expect(fit(explicit, NARROW).option.series[0].colorBy).toBe('series')
        })

        it('keeps series colors when bars are compared across series', () => {
            const value = { ...barOption, series: [{ type: 'bar' }, { type: 'bar' }] }

            expect(fit(value, NARROW).option.series.map((s: { colorBy?: string }) => s.colorBy)).toEqual([undefined, undefined])
        })

        it('truncates category labels to a share of the width within limits', () => {
            expect(fit(barOption, NARROW).option.yAxis.axisLabel).toEqual({ width: 134, overflow: 'truncate', hideOverlap: true })
            expect(fit(barOption, 100).option.yAxis.axisLabel.width).toBe(72)
            expect(fit(barOption, 2000).option.yAxis.axisLabel.width).toBe(280)
            expect(fit(barOption, NARROW).option.xAxis).toEqual({ type: 'value' })
        })
    })

    describe('tooltip', () => {
        it('wraps long text inside the host', () => {
            const { tooltip } = fit(barOption, NARROW).option

            expect(tooltip.confine).toBe(true)
            expect(tooltip.extraCssText).toContain(`max-width:${NARROW - 16}px`)
            expect(tooltip.extraCssText).toContain('white-space:normal')
        })

        it('shows the hovered slice for a pie and the hovered band for bars', () => {
            expect(fit(pieOption, NARROW).option.tooltip.trigger).toBe('item')
            expect(fit(barOption, NARROW).option.tooltip).toEqual(expect.objectContaining({ trigger: 'axis', axisPointer: { type: 'shadow' } }))
        })

        it('leaves the tooltip alone for other chart types', () => {
            const value = { tooltip: { trigger: 'none' }, series: [{ type: 'scatter' }] }

            expect(fit(value, NARROW).option.tooltip).toEqual({ trigger: 'none' })
        })
    })

    it('applies the condo palette and grid', () => {
        const { option } = fit(barOption, NARROW)

        expect(option.color).toHaveLength(8)
        expect(option.grid).toEqual({ left: 8, right: 8, top: 16, bottom: 8, containLabel: true })
    })
})
