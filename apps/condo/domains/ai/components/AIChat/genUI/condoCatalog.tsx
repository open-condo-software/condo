import { Catalog, type ComponentApi, type ComponentModel, type DataModel, type SurfaceModel } from '@a2ui/web_core/v0_9'
import dynamic from 'next/dynamic'
import React from 'react'
import { z } from 'zod'

import type { EChartsOption } from 'echarts-for-react'

import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

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

    if (variant === 'h1') return <Typography.Title level={1}>{text}</Typography.Title>
    if (variant === 'h2') return <Typography.Title level={2}>{text}</Typography.Title>
    if (variant === 'h3') return <Typography.Title level={3}>{text}</Typography.Title>
    if (variant === 'caption') return <Typography.Text size='small' type='secondary'>{text}</Typography.Text>
    return <Typography.Text>{text}</Typography.Text>
}

// Row — horizontal flex, children fill space equally (grid-like)
const RowRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const children = resolveChildren(component, surface)
    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12, width: '100%' }}>
            {children.map(child => (
                <div key={child.id} style={{ flex: 1, minWidth: 0 }}>
                    <ComponentRenderer component={child} surface={surface} />
                </div>
            ))}
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
    colors.purple['7'],
    colors.purple['5'],
    colors.blue['7'],
    colors.blue['5'],
    colors.green['7'],
    colors.green['5'],
    colors.teal['5'],
    colors.cyan['5'],
    colors.cyan['3'],
]

const ChartRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const option = resolveObject(component.properties.option, surface.dataModel) as unknown as EChartsOption | null
    const height = resolveValue(component.properties.height, surface.dataModel)

    if (!option) {
        return (
            <Typography.Text type='secondary' size='small'>
                [Chart: no option]
            </Typography.Text>
        )
    }

    const optionWithColors: EChartsOption = { color: CHART_COLOR_SET, ...option }
    const style: React.CSSProperties = { height: height ? `${height}px` : '300px' }

    return <ReactECharts option={optionWithColors} opts={{ renderer: 'svg' }} style={style} notMerge />
}

// --- Renderer registry ---
// Simple flat map. No circular references, no mutable refs, no child rendering.
const RENDERERS: Record<string, React.FC<RendererProps>> = {
    Text: TextRenderer,
    Row: RowRenderer,
    Col: ColRenderer,
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
