import { Catalog, type ComponentApi, type ComponentModel, type DataModel, type SurfaceModel } from '@a2ui/web_core/v0_9'
import dynamic from 'next/dynamic'
import React, { useEffect, useRef, useState } from 'react'
import { z } from 'zod'


import { Button, Card, Typography } from '@open-condo/ui'

import { isSafeUrl } from '@condo/domains/common/utils/url.utils'

import styles from './condoCatalog.module.css'
import { fitChartOption, parseChartOption } from './fitChartOption'

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
    const content = <span className={styles.text}>{text}</span>

    if (variant === 'h1') return <Typography.Title level={1}>{content}</Typography.Title>
    if (variant === 'h2') return <Typography.Title level={2}>{content}</Typography.Title>
    if (variant === 'h3') return <Typography.Title level={3}>{content}</Typography.Title>
    if (variant === 'caption') return <Typography.Text size='small' type='secondary'>{content}</Typography.Text>
    return <Typography.Text>{content}</Typography.Text>
}

// Below this basis a row child wraps onto the next line, so two charts stack in a 320px panel.
const ROW_ITEM_FLEX_BASIS = '16rem'

// Row — horizontal flex, children fill space proportionally to weight (grid-like)
const RowRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const children = resolveChildren(component, surface)
    return (
        <div className={styles.row}>
            {children.map(child => {
                const rawWeight = child.properties.weight
                const weight = typeof rawWeight === 'number' && rawWeight > 0 && Number.isFinite(rawWeight) ? rawWeight : 1
                return (
                    <div key={child.id} className={styles.rowItem} style={{ flex: `${weight} 1 ${ROW_ITEM_FLEX_BASIS}` }}>
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
        <div className={styles.card}>
            <Card title={title || undefined} width='100%'>
                <div className={styles.stack}>
                    {children.map(child => (
                        <div key={child.id} className={styles.stackItem}>
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
        <div className={styles.stack}>
            {children.map(child => (
                <div key={child.id} className={styles.stackItem}>
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

const DEFAULT_CHART_HEIGHT = 300

function contentBoxWidth (element: HTMLElement): number {
    const style = getComputedStyle(element)
    const padding = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
    return Math.max(0, element.clientWidth - padding)
}

const ChartRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const option = parseChartOption(resolveObject(component.properties.option, surface.dataModel))
    const height = resolveValue(component.properties.height, surface.dataModel)
    const hostRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<{ resize: (opts?: { width?: number, height?: number }) => void } | null>(null)
    const [hostWidth, setHostWidth] = useState(0)

    const hasOption = Boolean(option)

    useEffect(() => {
        const node = hostRef.current
        if (!node) return

        const observer = new ResizeObserver(() => {
            const width = Math.floor(contentBoxWidth(node))
            setHostWidth(prev => prev === width ? prev : width)
            chartRef.current?.resize({ width })
        })
        observer.observe(node)
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

    const fitted = fitChartOption(option, hostWidth, Number(height) || DEFAULT_CHART_HEIGHT)
    const style: React.CSSProperties = {
        width: hostWidth ? hostWidth : '100%',
        maxWidth: '100%',
        height: fitted.height,
    }

    return (
        <div ref={hostRef} className={styles.chartHost}>
            <ReactECharts
                option={fitted.option}
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
