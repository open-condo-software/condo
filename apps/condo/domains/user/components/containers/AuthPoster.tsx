import { Col, Row, Image } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PosterProps } from '@condo/domains/common/components/containers/LayoutWithPoster'

import './AuthPoster.css'


export const AuthPoster: React.FC<PosterProps> = ({ Header, Footer }) => {
    const intl = useIntl()
    const AuthPosterTitle = intl.formatMessage({ id: 'component.authPoster.title' })
    const AuthPosterDescription = intl.formatMessage({ id: 'component.authPoster.description' })

    const locale = intl.locale
    const imageSrc = `/auth/poster/image-${locale}.webp`

    return (
        <div className='auth-poster'>
            <div className='auth-poster-content'>
                <Row gutter={[0, 60]}>
                    <Col span={24} className='auth-poster-header'>
                        {Header}
                    </Col>
                    <Col span={24} className='auth-poster-text'>
                        <Row gutter={[0, 20]}>
                            <Col span={24}>
                                <Typography.Title level={2}>
                                    {AuthPosterTitle}
                                </Typography.Title>
                            </Col>
                            <Col span={24}>
                                <Typography.Text>
                                    {AuthPosterDescription}
                                </Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
            <div className='auth-poster-footer'>
                {Footer}
            </div>
            <div className='auth-poster-image'>
                <Image src={imageSrc} preview={false} />
            </div>
        </div>
    )
}
