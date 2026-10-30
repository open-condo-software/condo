import { colors } from '@open-condo/ui/colors'

import type { EChartsOption } from 'echarts-for-react'

type Dict = Record<string, unknown>

export type ChartOption = Dict & { series: Dict[] }

export interface FittedChart {
    option: EChartsOption
    height: number
}

const CHART_COLOR_SET = [
    colors.blue['7'],
    colors.teal['5'],
    colors.green['7'],
    colors.blue['5'],
    colors.green['5'],
    colors.cyan['5'],
    colors.cyan['3'],
    colors.purple['5'],
]

// Width assumed before the host is measured: the narrowest overlay.
const UNMEASURED_WIDTH = 320
// From this width a pie has room for callout lines and the legend fits one row.
const WIDE_CHART_MIN_WIDTH = 480

const GRID = { left: 8, right: 8, top: 16, bottom: 8, containLabel: true }

// Share of the width given to a category label, clamped so a narrow chart keeps a plot.
const LABEL_WIDTH_RATIO = 0.42
const LABEL_MIN_WIDTH = 72
const LABEL_MAX_WIDTH = 280

const LEGEND_ROW_HEIGHT = 22
const LEGEND_MARKER_SIZE = 8
const LEGEND_INLINE_GAP = 16
const LEGEND_STACKED_GAP = 8
// Marker plus the gap before the legend text.
const LEGEND_MARKER_SPACE = 28

const TOOLTIP_INSET = 16

const PIE_WIDE_RADIUS = '46%'
// Keeps a pie from rising into the top edge when the legend below is tall.
const PIE_MIN_CENTER_PERCENT = 18

function isDict (value: unknown): value is Dict {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function dictOrEmpty (value: unknown): Dict {
    return isDict(value) ? value : {}
}

export function parseChartOption (value: unknown): ChartOption | null {
    if (!isDict(value)) return null
    const series = Array.isArray(value.series) ? value.series : value.series ? [value.series] : []
    return { ...value, series: series.filter(isDict) }
}

function countLegendEntries (legend: Dict, series: Dict[]): number {
    if (Array.isArray(legend.data) && legend.data.length > 0) return legend.data.length

    const pie = series.find(item => item.type === 'pie' && Array.isArray(item.data))
    if (pie && Array.isArray(pie.data)) return pie.data.length
    return series.filter(item => typeof item.name === 'string' && item.name).length
}

function fitLegend (legend: Dict, width: number, wide: boolean): Dict {
    const rest = { ...legend }
    delete rest.top
    delete rest.right
    delete rest.left
    delete rest.bottom
    const textStyle = dictOrEmpty(legend.textStyle)

    return {
        ...rest,
        type: 'plain',
        orient: wide ? 'horizontal' : 'vertical',
        left: 0,
        bottom: 0,
        width: wide ? width : undefined,
        itemWidth: LEGEND_MARKER_SIZE,
        itemHeight: LEGEND_MARKER_SIZE,
        itemGap: wide ? LEGEND_INLINE_GAP : LEGEND_STACKED_GAP,
        textStyle: wide ? textStyle : {
            ...textStyle,
            width: Math.max(LABEL_MIN_WIDTH, width - LEGEND_MARKER_SPACE),
            overflow: 'truncate',
            ellipsis: '...',
        },
    }
}

function fitCategoryAxis (axis: unknown, labelWidth: number): unknown {
    if (!isDict(axis) || axis.type !== 'category') return axis

    return {
        ...axis,
        axisLabel: {
            ...dictOrEmpty(axis.axisLabel),
            width: labelWidth,
            overflow: 'truncate',
            hideOverlap: true,
        },
    }
}

function fitSeriesItem (item: Dict, wide: boolean, centerYPercent: number, isOnlySeries: boolean): Dict {
    // A lone bar series has one legend entry, so a palette per bar adds no ambiguity.
    if (item.type === 'bar' && isOnlySeries && !item.colorBy) {
        return { ...item, colorBy: 'data' }
    }
    if (item.type !== 'pie') return item

    return {
        ...item,
        center: ['50%', `${centerYPercent}%`],
        ...(wide ? { radius: PIE_WIDE_RADIUS } : {}),
        label: { ...dictOrEmpty(item.label), show: wide },
        labelLine: { ...dictOrEmpty(item.labelLine), show: wide },
    }
}

function fitTooltip (tooltip: unknown, series: Dict[], width: number): unknown {
    const hasPie = series.some(item => item.type === 'pie')
    const hasCartesian = series.some(item => item.type === 'bar' || item.type === 'line')
    if (!hasPie && !hasCartesian) return tooltip

    const current = dictOrEmpty(tooltip)
    // ECharts tooltips do not wrap by default, so long category names overflow the host.
    const wrapped = {
        ...current,
        confine: true,
        extraCssText: `max-width:${Math.max(LABEL_MIN_WIDTH, width - TOOLTIP_INSET)}px;white-space:normal;overflow-wrap:break-word;`,
    }
    if (!hasCartesian) return { ...wrapped, trigger: 'item' }

    return {
        ...wrapped,
        trigger: 'axis',
        axisPointer: { ...dictOrEmpty(current.axisPointer), type: 'shadow' },
    }
}

export function fitChartOption (option: ChartOption, hostWidth: number, baseHeight: number): FittedChart {
    const width = hostWidth || UNMEASURED_WIDTH
    const wide = width >= WIDE_CHART_MIN_WIDTH
    const legend = isDict(option.legend) && option.legend.show !== false ? option.legend : null

    const legendEntries = legend ? countLegendEntries(legend, option.series) : 0
    const legendRows = wide ? Math.min(1, legendEntries) : legendEntries
    const legendHeight = legendRows * LEGEND_ROW_HEIGHT
    const height = baseHeight + legendHeight

    const centerYPercent = Math.max(PIE_MIN_CENTER_PERCENT, Math.round((baseHeight / 2 / height) * 100))
    const labelWidth = Math.max(LABEL_MIN_WIDTH, Math.min(LABEL_MAX_WIDTH, Math.floor(width * LABEL_WIDTH_RATIO)))
    const isOnlySeries = option.series.length === 1

    const fitted: Dict = {
        ...option,
        color: CHART_COLOR_SET,
        grid: { ...GRID, bottom: GRID.bottom + legendHeight },
        tooltip: fitTooltip(option.tooltip, option.series, width),
        series: option.series.map(item => fitSeriesItem(item, wide, centerYPercent, isOnlySeries)),
    }
    if (option.xAxis) fitted.xAxis = fitCategoryAxis(option.xAxis, labelWidth)
    if (option.yAxis) fitted.yAxis = fitCategoryAxis(option.yAxis, labelWidth)
    if (legend) fitted.legend = fitLegend(legend, width, wide)

    return { option: fitted, height }
}
