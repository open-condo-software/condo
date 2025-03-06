import { Col, Row, Image } from 'antd'
import React from 'react'

import { Typography } from '@open-condo/ui'

import { PosterProps } from '@condo/domains/common/components/containers/LayoutWithPoster'

import './AuthPoster.css'


// TODO(DOMA-9722): add translations
export const AuthPoster: React.FC<PosterProps> = ({ Header, Footer }) => {
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
                                    Сокращайте расходы, улучшайте процессы и&nbsp;отношения с жителями
                                </Typography.Title>
                            </Col>
                            <Col span={24}>
                                <Typography.Text>
                                    Онлайн-платформа для управляющих компаний, ТСН, ТСЖ, РСО
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
                {/* TODO(DOMA-9722): remove hardcode */}
                <Image src='/auth-test.png' preview={false} />
            </div>
        </div>
    )
}
