import React, { Component } from 'react'
import { z } from 'zod'

import { Button, Card, Checkbox, Input, Select, Space, Typography } from '@open-condo/ui'

import type { ComponentModel, DataModel, SurfaceModel } from '@a2ui/web_core/v0_9'
import { Catalog, type ComponentApi } from '@a2ui/web_core/v0_9'

export const CONDO_CATALOG_ID = 'https://condo.open-condo.software/a2ui/v1/catalog.json'

// --- Helpers ---

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

function resolveBoolean (value: unknown, dataModel: DataModel): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'object' && value !== null && 'path' in value) {
        const path = (value as { path: string }).path
        const resolved = dataModel.get(path)
        if (typeof resolved === 'boolean') return resolved
    }
    return false
}

function resolveStringList (value: unknown, dataModel: DataModel): string[] {
    if (Array.isArray(value)) return value
    if (typeof value === 'object' && value !== null && 'path' in value) {
        const path = (value as { path: string }).path
        const resolved = dataModel.get(path)
        if (Array.isArray(resolved)) return resolved
    }
    return []
}

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

const ButtonRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const text = resolveValue(component.properties.text, surface.dataModel)
    const variant = resolveValue(component.properties.variant, surface.dataModel)

    return (
        <Button type={variant === 'primary' ? 'primary' : 'secondary'}>
            {text}
        </Button>
    )
}

const RowRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const children = resolveChildren(component, surface)
    const justify = resolveValue(component.properties.justify, surface.dataModel)
    const align = resolveValue(component.properties.align, surface.dataModel)

    const alignMap: Record<string, 'start' | 'center' | 'end'> = {
        start: 'start', center: 'center', end: 'end',
    }

    const content = (
        <Space
            direction='horizontal'
            size={12}
            align={alignMap[align ?? 'start'] ?? 'start'}
            width={justify === 'between' ? '100%' : undefined}
        >
            {children.map(child => (
                <ComponentRenderer key={child.id} component={child} surface={surface} />
            ))}
        </Space>
    )

    if (justify === 'between') {
        return <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>{content}</div>
    }
    return content
}

const ColumnRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const children = resolveChildren(component, surface)
    return (
        <Space direction='vertical' size={8} width='100%'>
            {children.map(child => (
                <ComponentRenderer key={child.id} component={child} surface={surface} />
            ))}
        </Space>
    )
}

const CardRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const children = resolveChildren(component, surface)
    return (
        <Card>
            {children.map(child => (
                <ComponentRenderer key={child.id} component={child} surface={surface} />
            ))}
        </Card>
    )
}

const TextFieldRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const label = resolveValue(component.properties.label, surface.dataModel)
    const value = resolveValue(component.properties.value, surface.dataModel)
    const variant = resolveValue(component.properties.variant, surface.dataModel)
    const placeholder = resolveValue(component.properties.placeholder, surface.dataModel)

    if (variant === 'longText') {
        return (
            <div>
                {label && <Typography.Text size='small' type='secondary'>{label}</Typography.Text>}
                <Input.TextArea
                    value={value}
                    placeholder={placeholder || label}
                />
            </div>
        )
    }

    return (
        <div>
            {label && <Typography.Text size='small' type='secondary'>{label}</Typography.Text>}
            <Input
                value={value}
                placeholder={placeholder || label}
            />
        </div>
    )
}

const CheckBoxRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const label = resolveValue(component.properties.label, surface.dataModel)
    const checked = resolveBoolean(component.properties.value, surface.dataModel)

    return (
        <Checkbox checked={checked}>
            {label}
        </Checkbox>
    )
}

const ChoicePickerRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const options = (component.properties.options ?? []) as { label: string, value: string }[]
    const value = resolveStringList(component.properties.value, surface.dataModel)
    const selectOptions = options.map(opt => ({ label: opt.label, value: opt.value }))

    return (
        <Select
            options={selectOptions}
            value={value[0]}
        />
    )
}

const DividerRenderer: React.FC<RendererProps> = () => {
    return <hr style={{ border: 'none', borderTop: '1px solid #e8e8e8', margin: '8px 0' }} />
}

const IconRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const name = resolveValue(component.properties.name, surface.dataModel)
    return <Typography.Text>{name ? `[${name}]` : ''}</Typography.Text>
}

const ListRenderer: React.FC<RendererProps> = ({ component, surface }) => {
    const children = resolveChildren(component, surface)
    return (
        <div>
            {children.map(child => (
                <div key={child.id} style={{ marginBottom: 8 }}>
                    <ComponentRenderer component={child} surface={surface} />
                </div>
            ))}
        </div>
    )
}

const RENDERERS: Record<string, React.FC<RendererProps>> = {
    Text: TextRenderer,
    Button: ButtonRenderer,
    Row: RowRenderer,
    Column: ColumnRenderer,
    Card: CardRenderer,
    TextField: TextFieldRenderer,
    CheckBox: CheckBoxRenderer,
    ChoicePicker: ChoicePickerRenderer,
    Divider: DividerRenderer,
    Icon: IconRenderer,
    List: ListRenderer,
}

class ComponentErrorBoundary extends Component<
    { componentId: string, children: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false }

    static getDerivedStateFromError () {
        return { hasError: true }
    }

    componentDidCatch (err: unknown) {
        console.error(`[A2UI] Component "${this.props.componentId}" render error:`, err)
    }

    render () {
        if (this.state.hasError) {
            return (
                <Typography.Text type='secondary' size='small'>
                    [Failed to render: {this.props.componentId}]
                </Typography.Text>
            )
        }
        return this.props.children
    }
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

    return (
        <ComponentErrorBoundary componentId={component.id}>
            <Renderer component={component} surface={surface} />
        </ComponentErrorBoundary>
    )
}

// --- Catalog ---

// We create a minimal catalog with permissive schemas.
// The MessageProcessor needs it to know which components are valid.
// Actual rendering is done by our React ComponentRenderer above.
const permissiveSchema = z.record(z.unknown())

const componentApis = Object.keys(RENDERERS).map(name => ({
    name,
    schema: permissiveSchema,
})) as unknown as ComponentApi[]

export const condoCatalog = new Catalog(CONDO_CATALOG_ID, componentApis)
