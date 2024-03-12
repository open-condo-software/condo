import get from 'lodash/get'
import getConfig from 'next/config'
import React, { CSSProperties, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Space, Typography } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'


const {
    publicRuntimeConfig,
} = getConfig()

const { tourConfig } = publicRuntimeConfig

const CARD_VIDEO_WRAPPER_STYLES: CSSProperties = {
    borderRadius: '12px',
    overflow: 'hidden',
    height: '259px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}

export const CardVideo = ({ activeTourStep }) => {
    const intl = useIntl()
    const activeStepWithDefault = useMemo(() => activeTourStep || 'default', [activeTourStep])
    const CardVideoTitle = intl.formatMessage({ id: `tour.cardVideo.title.${activeStepWithDefault}` })
    const CardVideoDescription = intl.formatMessage({ id: `tour.cardVideo.description.${activeStepWithDefault}` })

    const videoUrl = useMemo(() => get(tourConfig, ['tour_video_url', activeStepWithDefault]), [activeStepWithDefault])

    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        setLoading(true)
    }, [videoUrl])

    return (
        <Card hoverable>
            <Space size={24} direction='vertical'>
                <div style={CARD_VIDEO_WRAPPER_STYLES}>
                    <iframe
                        width='100%'
                        height='100%'
                        src={videoUrl}
                        frameBorder='0'
                        onLoad={() => setLoading(false)}
                        hidden={loading}
                        allowFullScreen
                    />
                    {loading && <Loader size='large' />}
                </div>
                <Space size={8} direction='vertical'>
                    <Typography.Title level={2}>{CardVideoTitle}</Typography.Title>
                    <Typography.Paragraph type='secondary'>{CardVideoDescription}</Typography.Paragraph>
                </Space>
            </Space>
        </Card>
    )
}
