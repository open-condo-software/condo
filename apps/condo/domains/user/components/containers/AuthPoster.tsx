import { Col, Row, Image } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PosterProps } from '@condo/domains/common/components/containers/LayoutWithPoster'

import styles from './AuthPoster.module.css'


export const AuthPoster: React.FC<PosterProps> = ({ Header, Footer }) => {
    const intl = useIntl()
    const AuthPosterTitle = intl.formatMessage({ id: 'component.authPoster.title' })
    const AuthPosterDescription = intl.formatMessage({ id: 'component.authPoster.description' })

    const locale = intl.locale
    const imageSrc = `/auth/poster/image-${locale}.webp`

    return (
        <div className={styles.authPoster}>
            <div className={styles.authPosterContent}>
                <Row gutter={[0, 60]}>
                    <Col span={24}>
                        {Header}
                    </Col>
                    <Col span={24} className={styles.authPosterText}>
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
            <div className={styles.authPosterFooter}>
                {Footer}
            </div>
            <div className={styles.authPosterImage}>
                <Image src={imageSrc} preview={false} />
            </div>
        </div>
    )
}
