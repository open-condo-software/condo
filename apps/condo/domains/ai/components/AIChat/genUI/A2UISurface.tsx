import { MessageProcessor, type A2uiMessage, type SurfaceModel } from '@a2ui/web_core/v0_9'
import React, { useEffect, useMemo, useState } from 'react'

import { Space, Typography } from '@open-condo/ui'


import { ComponentRenderer, condoCatalog } from './condoCatalog'

interface A2UISurfacesProps {
    messages: A2uiMessage[]
    aiSessionId?: string
}

const SingleSurface: React.FC<{ surface: SurfaceModel, aiSessionId?: string }> = ({ surface, aiSessionId }) => {
    const rootComponent = surface.componentsModel.get('root')

    if (!rootComponent) {
        const allComponents = Array.from(surface.componentsModel.entries).map(([, comp]) => comp)

        if (allComponents.length === 0) {
            console.warn('[A2UI] Surface has no (root) components. Session:', aiSessionId, 'Surface:', surface.id)
            return null
        }

        console.warn('[A2UI] Surface has no (root) components. Session:', aiSessionId, 'Surface:', surface.id)

        // Collect IDs referenced as children by any component, so we only render
        // top-level components and avoid duplicating children that are already
        // rendered inside their parents.
        const childIds = new Set<string>()
        for (const comp of allComponents) {
            const childrenProp = comp.properties.children
            if (Array.isArray(childrenProp)) {
                childrenProp.forEach(id => childIds.add(id))
            } else if (childrenProp && typeof childrenProp === 'object' && 'array' in childrenProp) {
                (childrenProp as { array: string[] }).array.forEach(id => childIds.add(id))
            }
        }
        const topLevel = allComponents.filter(comp => !childIds.has(comp.id))

        return (
            <div style={{ width: '100%' }}>
                {(topLevel.length > 0 ? topLevel : allComponents).map(comp => (
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

export const A2UISurfaces: React.FC<A2UISurfacesProps> = ({ messages, aiSessionId }) => {
    // Create processor AND process messages in a single useMemo.
    // This runs exactly once per unique message content (keyed by JSON string).
    // No separate effect = no double-invoke, no "surface already exists".
    const { processor, error } = useMemo(() => {
        const proc = new MessageProcessor([condoCatalog])
        try {
            console.debug('[A2UI] Processing messages:', messages.length,
                'types:', messages.map(m => Object.keys(m).filter(k => k !== 'version')))
            proc.processMessages(messages)
            const surfaces = Array.from(proc.model.surfacesMap.values())
            console.debug('[A2UI] Processed surfaces:', surfaces.map(s => ({
                id: s.id,
                componentIds: Array.from(s.componentsModel.entries).map(([id]) => id),
            })))
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
                <SingleSurface key={surface.id} surface={surface} aiSessionId={aiSessionId} />
            ))}
        </Space>
    )
}
