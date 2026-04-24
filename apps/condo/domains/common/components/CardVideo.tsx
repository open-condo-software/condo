import React, { CSSProperties, useEffect, useState } from 'react'

import { Card, Space, Typography } from '@open-condo/ui'

import { Loader } from './Loader'


const CARD_VIDEO_WRAPPER_STYLES: CSSProperties = {
    borderRadius: '12px',
    overflow: 'hidden',
    height: '260px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}

export const CardVideo = ({ src, title, description, autoplay = false }) => {
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        setLoading(true)
    }, [src])

    return (
        <Card hoverable>
            <Space size={24} direction='vertical'>
                <div style={CARD_VIDEO_WRAPPER_STYLES}>
                    <iframe
                        width='100%'
                        height='100%'
                        src={autoplay ? `${src}&autoplay=1&muted=1` : src}
                        frameBorder='0'
                        onLoad={() => setLoading(false)}
                        hidden={loading}
                        allowFullScreen
                    />
                    {loading && <Loader size='large' />}
                </div>
                <Space size={8} direction='vertical'>
                    <Typography.Title level={2}>{title}</Typography.Title>
                    <Typography.Paragraph type='secondary'>{description}</Typography.Paragraph>
                </Space>
            </Space>
        </Card>
    )
}
