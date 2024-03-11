import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Space, Typography } from '@open-condo/ui'


const CARD_VIDEO_WRAPPER_STYLES: CSSProperties = { borderRadius: '12px', overflow: 'hidden', height: '254px', width: '100%' }

export const CardVideo = () => {
    const intl = useIntl()
    const CardVideoTitle = intl.formatMessage({ id: 'tour.cardVideo.title' })
    const CardVideoDescription = intl.formatMessage({ id: 'tour.cardVideo.description' })

    return (
        <Card hoverable>
            <Space size={24} direction='vertical'>
                <div style={CARD_VIDEO_WRAPPER_STYLES}>
                    <iframe width='100%' height='100%'
                        src='https://www.youtube.com/embed/NpEaa2P7qZI?si=oMpwQ-gMvTzAcyNu'
                        title='YouTube video player' frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                        allowFullScreen
                    />
                </div>
                <Space size={8} direction='vertical'>
                    <Typography.Title level={2}>{CardVideoTitle}</Typography.Title>
                    <Typography.Paragraph type='secondary'>{CardVideoDescription}</Typography.Paragraph>
                </Space>
            </Space>
        </Card>
    )
}
