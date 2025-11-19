import { Row, Col } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Typography } from '@open-condo/ui'

import styles from './styles.module.css'

import { PosterLayout } from '../containers/PosterLayout'


const SUCCESSFUL_IMAGE_SRC = { main: '/dino/success@2x.png', placeholder: '/dino/success.png' }

type SuccessfulEmailVerificationPosterProps = {
    onContinueClick: () => Promise<void>
}

export const SuccessfulEmailVerificationPoster: React.FC<SuccessfulEmailVerificationPosterProps> = ({
    onContinueClick = () => ({}),
}) => {
    const intl = useIntl()
    const PosterTitle = intl.formatMessage({ id: 'component.successfulEmailVerificationPoster.title' })
    const PosterDescription = intl.formatMessage({ id: 'component.successfulEmailVerificationPoster.description' })
    const PosterContinueMessage = intl.formatMessage({ id: 'component.successfulEmailVerificationPoster.continue' })

    return (
        <PosterLayout
            image={SUCCESSFUL_IMAGE_SRC}
            children={(
                <Row className={styles.contentWrapper} gutter={[0, 40]}>
                    <Col span={24}>
                        <Row gutter={[0, 16]}>
                            <Col span={24}>
                                <Typography.Title level={1}>
                                    {PosterTitle}
                                </Typography.Title>
                            </Col>
                            <Col span={24}>
                                <Typography.Text>
                                    {PosterDescription}
                                </Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Button
                            type='primary'
                            onClick={onContinueClick}
                        >
                            {PosterContinueMessage}
                        </Button>
                    </Col>
                </Row>
            )}
        />
    )
}
