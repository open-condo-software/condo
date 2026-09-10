import { MessageProcessor, type A2uiMessage, type SurfaceModel } from '@a2ui/web_core/v0_9'
import React, { useEffect, useMemo, useState } from 'react'

import { Space, Typography } from '@open-condo/ui'


import { ComponentRenderer, condoCatalog } from './condoCatalog'

interface A2UISurfacesProps {
    messages: A2uiMessage[]
}

const SingleSurface: React.FC<{ surface: SurfaceModel }> = ({ surface }) => {
    const rootComponent = surface.componentsModel.get('root')

    if (!rootComponent) {
        // No 'root' component — fall back to rendering all top-level components.
        // If there are none, the surface was created but no updateComponents message
        // was processed (e.g. the AI sent createSurface but not updateComponents).
        const allComponents = Array.from(surface.componentsModel.entries()).map(([, comp]) => comp)

        if (allComponents.length === 0) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[A2UI] Surface has no components. Surface ID:', surface.id,
                    'This usually means the AI sent createSurface but no updateComponents message.')
            }
            return null
        }

        if (process.env.NODE_ENV !== 'production') {
            console.warn('[A2UI] No root component found, rendering all components. IDs:',
                allComponents.map(c => c.id))
        }

        return (
            <div style={{ width: '100%' }}>
                {allComponents.map(comp => (
                    <ComponentRenderer key={comp.id} component={comp} surface={surface} />
                ))}
            </div>
        )
    }

    return (
        <div style={{ width: '100%' }}>
            <ComponentRenderer component={rootComponent} surface={surface} />
        </div>
    )
}

export const A2UISurfaces: React.FC<A2UISurfacesProps> = ({ messages }) => {
    // Create processor AND process messages in a single useMemo.
    // This runs exactly once per unique message content (keyed by JSON string).
    // No separate effect = no double-invoke, no "surface already exists".
    const { processor, error } = useMemo(() => {
        const proc = new MessageProcessor([condoCatalog])
        try {
            if (process.env.NODE_ENV !== 'production') {
                console.debug('[A2UI] Processing messages:', messages.length,
                    'types:', messages.map(m => Object.keys(m).filter(k => k !== 'version')))
            }
            proc.processMessages(messages)
            if (process.env.NODE_ENV !== 'production') {
                const surfaces = Array.from(proc.model.surfacesMap.values())
                console.debug('[A2UI] Processed surfaces:', surfaces.map(s => ({
                    id: s.id,
                    componentIds: Array.from(s.componentsModel.entries()).map(([id]) => id),
                })))
            }
            return { processor: proc, error: null }
        } catch (err) {
            console.error('[A2UI] Failed to process messages:', err)
            return { processor: proc, error: err }
        }
    }, [JSON.stringify(messages)])

    const [surfaces, setSurfaces] = useState<SurfaceModel[]>([])

    useEffect(() => {
        const sync = () => setSurfaces(Array.from(processor.model.surfacesMap.values()))

        const createdSub = processor.onSurfaceCreated(sync)
        const deletedSub = processor.onSurfaceDeleted(sync)

        // Sync immediately — surfaces were created during useMemo, before subscribers were attached
        sync()

        return () => {
            createdSub.unsubscribe()
            deletedSub.unsubscribe()
        }
    }, [processor])

    if (error) {
        return (
            <Typography.Text type='secondary'>
                UI rendering error. Please try again.
            </Typography.Text>
        )
    }

    if (surfaces.length === 0) return null

    return (
        <Space direction='vertical' size={12} width='100%'>
            {surfaces.map(surface => (
                <SingleSurface key={surface.id} surface={surface} />
            ))}
        </Space>
    )
}
