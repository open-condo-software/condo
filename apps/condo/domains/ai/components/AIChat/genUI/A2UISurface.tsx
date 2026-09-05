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
        return (
            <Typography.Text type='secondary' size='small'>
                [Waiting for root component...]
            </Typography.Text>
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
            proc.processMessages(messages)
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
