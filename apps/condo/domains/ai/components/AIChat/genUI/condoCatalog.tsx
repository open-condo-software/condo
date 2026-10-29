import { Catalog, type ComponentApi, type ComponentModel, type DataModel, type SurfaceModel } from '@a2ui/web_core/v0_9'
import dynamic from 'next/dynamic'
import React, { useEffect, useRef, useState } from 'react'
import { z } from 'zod'


import { Button, Card, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { isSafeUrl } from '@condo/domains/common/utils/url.utils'

import type { EChartsOption } from 'echarts-for-react'

export const CONDO_CATALOG_ID = 'https://condo.open-condo.software/a2ui/v1/catalog.json'

// --- Data resolution helpers ---

function resolveValue (value: unknown, dataModel: DataModel): string {
    if (value == null) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'object' && value !== null && 'path' in value) {
        const path = (value as { path: string }).path
        const resolved = dataModel.get(path)
        if (resolved == null) return ''
        if (typeof resolved === 'string') return resolved
        if (typeof resolved === 'number' || typeof resolved === 'boolean') return String(resolved)
    }
    return ''
}

function resolveObject (value: unknown, dataModel: DataModel): Record<string, unknown> | null {
    if (value == null) return null
    if (typeof value === 'object' && value !== null) {
        if ('path' in value) {
            const path = (value as { path: string }).path
            const resolved = dataModel.get(path)
            if (resolved != null && typeof resolved === 'object') {
                return resolved as Record<string, unknown>
            }
            return null
        }
        return value as Record<string, unknown>
    }
    return null
}

// --- Child resolution ---

function resolveChildren (component: ComponentModel, surface: SurfaceModel): ComponentModel[] {
    const childrenProp = component.properties.children
    if (!childrenProp) return []
    if (Array.isArray(childrenProp)) {
        return childrenProp.map(id => surface.componentsModel.get(id)).filter(Boolean) as ComponentModel[]
    }
    if (typeof childrenProp === 'object' && childrenProp !== null && 'array' in childrenProp) {
        const ids = (childrenProp as { array: string[] }).array
        return ids.map(id => surface.componentsModel.get(id)).filter(Boolean) as ComponentModel[]
    }
    return []
}

// --- Component renderers ---

interface RendererProps {
    component: ComponentModel
    surface: SurfaceModel
}

const TextRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const text = resolveValue(component.properties.text, surface.dataModel)
    const variant = resolveValue(component.properties.variant, surface.dataModel)
    const content = <span style={{ whiteSpace: 'pre-line' }}>{text}</span>

    if (variant === 'h1') return <Typography.Title level={1}>{content}</Typography.Title>
    if (variant === 'h2') return <Typography.Title level={2}>{content}</Typography.Title>
    if (variant === 'h3') return <Typography.Title level={3}>{content}</Typography.Title>
    if (variant === 'caption') return <Typography.Text size='small' type='secondary'>{content}</Typography.Text>
    return <Typography.Text>{content}</Typography.Text>
}

// Below this basis a row child wraps onto the next line, so two charts stack in a 320px panel.
const ROW_ITEM_FLEX_BASIS = '16rem'
const CARD_MAX_WIDTH = 550

// Row — horizontal flex, children fill space proportionally to weight (grid-like)
const RowRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const children = resolveChildren(component, surface)
    return (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' }}>
            {children.map(child => {
                const rawWeight = child.properties.weight
                const weight = typeof rawWeight === 'number' && rawWeight > 0 && Number.isFinite(rawWeight) ? rawWeight : 1
                return (
                    <div key={child.id} style={{ flex: `${weight} 1 ${ROW_ITEM_FLEX_BASIS}`, minWidth: 0, maxWidth: '100%' }}>
                        <ComponentRenderer component={child} surface={surface} />
                    </div>
                )
            })}
        </div>
    )
}

const ButtonRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const text = resolveValue(component.properties.text, surface.dataModel)
    const rawHref = resolveValue(component.properties.href, surface.dataModel).trim()
    const href = rawHref && isSafeUrl(rawHref) ? rawHref : ''

    if (!text || !href) return null

    return (
        <Button type='secondary' href={href} target='_blank' rel='noopener noreferrer' block>
            {text}
        </Button>
    )
}

const CardRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const title = resolveValue(component.properties.title, surface.dataModel)
    const children = resolveChildren(component, surface)

    return (
        <div style={{ width: '100%', maxWidth: CARD_MAX_WIDTH }}>
            <Card title={title || undefined} width='100%'>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    {children.map(child => (
                        <div key={child.id} style={{ width: '100%' }}>
                            <ComponentRenderer component={child} surface={surface} />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}

// Col — vertical flex, children stack and fill width
const ColRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const children = resolveChildren(component, surface)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {children.map(child => (
                <div key={child.id} style={{ width: '100%' }}>
                    <ComponentRenderer component={child} surface={surface} />
                </div>
            ))}
        </div>
    )
}

const ReactECharts = dynamic(
    () => import('echarts-for-react').then((mod) => mod.default),
    { ssr: false, loading: () => null },
)

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

const DEFAULT_CHART_HEIGHT = 300
// Share of the chart width given to a category label, clamped so a 320px panel still has a plot.
const CHART_LABEL_WIDTH_RATIO = 0.42
const CHART_LABEL_MIN_WIDTH = 72
const CHART_LABEL_MAX_WIDTH = 280
const CHART_LABEL_FALLBACK_WIDTH = 320
const CHART_GRID = { left: 8, right: 8, top: 16, bottom: 8, containLabel: true }
// One plain legend row. The list grows the chart instead of paging.
const LEGEND_ITEM_HEIGHT = 22
// Callout lines need a margin around the pie. Below this width they are clipped.
const PIE_CALLOUT_MIN_WIDTH = 480

function fitCategoryAxis (axis: unknown, labelWidth: number): unknown {
    if (!axis || typeof axis !== 'object' || Array.isArray(axis)) return axis
    const categoryAxis = axis as { type?: string, axisLabel?: Record<string, unknown> }
    if (categoryAxis.type !== 'category') return axis

    return {
        ...categoryAxis,
        axisLabel: {
            ...categoryAxis.axisLabel,
            width: labelWidth,
            overflow: 'truncate',
            hideOverlap: true,
        },
    }
}

function isRecord (value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function seriesList (series: unknown): Record<string, unknown>[] {
    const list = Array.isArray(series) ? series : series ? [series] : []
    return list.filter(isRecord)
}

function countLegendItems (legend: unknown, series: unknown): number {
    if (!isRecord(legend) || legend.show === false) return 0
    if (Array.isArray(legend.data) && legend.data.length > 0) return legend.data.length

    const items = seriesList(series)
    const pie = items.find(item => item.type === 'pie' && Array.isArray(item.data))
    if (pie && Array.isArray(pie.data)) return pie.data.length
    return items.filter(item => typeof item.name === 'string' && item.name).length
}

function legendBlockHeight (legend: unknown, series: unknown, hostWidth: number): number {
    const rows = countLegendItems(legend, series)
    if (rows === 0) return 0
    return hostWidth >= PIE_CALLOUT_MIN_WIDTH ? LEGEND_ITEM_HEIGHT : rows * LEGEND_ITEM_HEIGHT
}

function fitLegend (legend: unknown, hostWidth: number): unknown {
    if (!isRecord(legend) || legend.show === false) return legend

    const inline = hostWidth >= PIE_CALLOUT_MIN_WIDTH
    const rest = { ...legend }
    delete rest.top
    delete rest.right
    delete rest.left
    delete rest.bottom
    const textStyle = isRecord(legend.textStyle) ? legend.textStyle : {}

    return {
        ...rest,
        type: 'plain',
        orient: inline ? 'horizontal' : 'vertical',
        left: 0,
        bottom: 0,
        width: inline ? hostWidth : undefined,
        itemWidth: 8,
        itemHeight: 8,
        itemGap: inline ? 16 : 8,
        textStyle: inline ? textStyle : {
            ...textStyle,
            width: Math.max(CHART_LABEL_MIN_WIDTH, hostWidth - 28),
            overflow: 'truncate',
            ellipsis: '...',
        },
    }
}

function fitSeries (series: unknown, hostWidth: number, centerYPercent: number): unknown {
    const showCallouts = hostWidth >= PIE_CALLOUT_MIN_WIDTH
    // A lone bar series has one legend entry, so palette per bar adds no ambiguity.
    const isSingleSeries = seriesList(series).length === 1
    const mapItem = (item: unknown) => {
        if (isRecord(item) && item.type === 'bar' && isSingleSeries && !item.colorBy) {
            return { ...item, colorBy: 'data' }
        }
        if (!isRecord(item) || item.type !== 'pie') return item
        return {
            ...item,
            center: ['50%', `${centerYPercent}%`],
            ...(showCallouts ? { radius: '46%' } : {}),
            label: { ...(isRecord(item.label) ? item.label : {}), show: showCallouts },
            labelLine: { ...(isRecord(item.labelLine) ? item.labelLine : {}), show: showCallouts },
        }
    }

    if (Array.isArray(series)) return series.map(mapItem)
    return mapItem(series)
}

function fitTooltip (tooltip: unknown, series: unknown, hostWidth: number): unknown {
    const items = seriesList(series)
    const hasPie = items.some(item => item.type === 'pie')
    const hasCartesian = items.some(item => item.type === 'bar' || item.type === 'line')
    const current = isRecord(tooltip) ? tooltip : {}
    // ECharts tooltips are nowrap by default; long category names overflow the panel.
    const wrapped = {
        ...current,
        confine: true,
        extraCssText: `max-width:${Math.max(CHART_LABEL_MIN_WIDTH, hostWidth - 16)}px;white-space:normal;overflow-wrap:break-word;`,
    }

    if (hasPie && !hasCartesian) {
        return { ...wrapped, trigger: 'item' }
    }
    if (!hasCartesian) return tooltip

    return {
        ...wrapped,
        trigger: 'axis',
        axisPointer: { ...(isRecord(current.axisPointer) ? current.axisPointer : {}), type: 'shadow' },
    }
}

function fitChartOption (option: EChartsOption, labelWidth: number, hostWidth: number, baseHeight: number): EChartsOption {
    const legendBlock = legendBlockHeight(option.legend, option.series, hostWidth)
    const totalHeight = baseHeight + legendBlock
    const centerYPercent = Math.max(18, Math.round((baseHeight / 2 / totalHeight) * 100))
    const fitted: EChartsOption = {
        ...option,
        color: CHART_COLOR_SET,
        grid: { ...CHART_GRID, bottom: CHART_GRID.bottom + legendBlock },
        tooltip: fitTooltip(option.tooltip, option.series, hostWidth),
    }
    if (fitted.xAxis) fitted.xAxis = fitCategoryAxis(fitted.xAxis, labelWidth) as EChartsOption['xAxis']
    if (fitted.yAxis) fitted.yAxis = fitCategoryAxis(fitted.yAxis, labelWidth) as EChartsOption['yAxis']
    if (fitted.legend) fitted.legend = fitLegend(fitted.legend, hostWidth) as EChartsOption['legend']
    if (fitted.series) fitted.series = fitSeries(fitted.series, hostWidth, centerYPercent) as EChartsOption['series']
    return fitted
}

function contentBoxWidth (element: HTMLElement): number {
    const style = getComputedStyle(element)
    const padding = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
    return Math.max(0, element.clientWidth - padding)
}

// The chart canvas keeps its last pixel width, so the host itself stops shrinking.
// Measure the narrowest ancestor instead: that is the panel.
function constrainingWidth (node: HTMLElement): number {
    let width = contentBoxWidth(node)
    let current = node.parentElement
    while (current && current !== document.body) {
        const next = contentBoxWidth(current)
        if (next > 0) width = Math.min(width, next)
        current = current.parentElement
    }
    return Math.floor(width)
}

const ChartRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const option = resolveObject(component.properties.option, surface.dataModel) as unknown as EChartsOption | null
    const height = resolveValue(component.properties.height, surface.dataModel)
    const hostRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<{ resize: (opts?: { width?: number, height?: number }) => void } | null>(null)
    const [hostWidth, setHostWidth] = useState(0)

    const hasOption = Boolean(option)

    useEffect(() => {
        const node = hostRef.current
        if (!node) return

        const observer = new ResizeObserver(() => {
            const width = constrainingWidth(node)
            setHostWidth(prev => prev === width ? prev : width)
            chartRef.current?.resize({ width })
        })
        observer.observe(node)
        let current = node.parentElement
        while (current && current !== document.body) {
            observer.observe(current)
            current = current.parentElement
        }
        return () => observer.disconnect()
    }, [hasOption])

    useEffect(() => {
        if (!hostWidth) return
        chartRef.current?.resize({ width: hostWidth })
    }, [hostWidth])

    if (!option) {
        return (
            <Typography.Text type='secondary' size='small'>
                [Chart: no option]
            </Typography.Text>
        )
    }

    const measuredWidth = hostWidth || CHART_LABEL_FALLBACK_WIDTH
    const labelWidth = Math.max(
        CHART_LABEL_MIN_WIDTH,
        Math.min(CHART_LABEL_MAX_WIDTH, Math.floor(measuredWidth * CHART_LABEL_WIDTH_RATIO)),
    )
    const baseHeight = Number(height) || DEFAULT_CHART_HEIGHT
    const legendBlock = legendBlockHeight(option.legend, option.series, measuredWidth)
    const optionWithColors = fitChartOption(option, labelWidth, measuredWidth, baseHeight)
    const style: React.CSSProperties = {
        width: hostWidth ? hostWidth : '100%',
        maxWidth: '100%',
        height: baseHeight + legendBlock,
    }

    return (
        <div ref={hostRef} style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
            <ReactECharts
                option={optionWithColors}
                opts={{ renderer: 'svg' }}
                style={style}
                notMerge
                onChartReady={(instance) => {
                    chartRef.current = instance
                }}
            />
        </div>
    )
}

// --- Renderer registry ---
// Simple flat map. No circular references, no mutable refs, no child rendering.
const RENDERERS: Record<string, React.FC<RendererProps>> = {
    Text: TextRenderer,
    Row: RowRenderer,
    Col: ColRenderer,
    Card: CardRenderer,
    Button: ButtonRenderer,
    Chart: ChartRenderer,
}

export const ComponentRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const Renderer = RENDERERS[component.type]

    if (!Renderer) {
        return (
            <Typography.Text type='secondary' size='small'>
                [Unknown component: {component.type}]
            </Typography.Text>
        )
    }

    return <Renderer component={component} surface={surface} />
}

// --- Catalog ---

const permissiveSchema = z.record(z.string(), z.unknown())

const componentApis = Object.keys(RENDERERS).map(name => ({
    name,
    schema: permissiveSchema,
})) as unknown as ComponentApi[]

export const condoCatalog = new Catalog(CONDO_CATALOG_ID, componentApis)
