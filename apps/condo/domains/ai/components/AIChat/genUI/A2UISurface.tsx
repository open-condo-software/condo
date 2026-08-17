import { MessageProcessor, type A2uiMessage, type SurfaceModel } from '@a2ui/web_core/v0_9'
import React, { useEffect, useMemo, useRef, useState } from 'react'

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
    const [processor] = useState(() => new MessageProcessor([condoCatalog]))
    const [surfaces, setSurfaces] = useState<SurfaceModel[]>([])
    const [error, setError] = useState<string | null>(null)
    const processedKey = useRef<string>('')

    const messagesKey = useMemo(() => JSON.stringify(messages), [messages])

    useEffect(() => {
        const sync = () => setSurfaces(Array.from(processor.model.surfacesMap.values()))

        const createdSub = processor.onSurfaceCreated(sync)
        const deletedSub = processor.onSurfaceDeleted(sync)

        return () => {
            createdSub.unsubscribe()
            deletedSub.unsubscribe()
        }
    }, [processor])

    useEffect(() => {
        if (!messagesKey || messagesKey === processedKey.current) return
        processedKey.current = messagesKey

        try {
            setError(null)
            processor.processMessages(messages)
        } catch (err) {
            console.error('[A2UI] Failed to process messages:', err)
            setError('UI rendering error. Please try asking again.')
        }
    }, [processor, messages, messagesKey])

    if (error) {
        return (
            <Typography.Text type='secondary'>
                {error}
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
