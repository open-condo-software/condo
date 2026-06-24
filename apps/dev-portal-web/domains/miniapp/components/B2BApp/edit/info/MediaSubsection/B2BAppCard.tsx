import { Image } from 'antd'
import React, { CSSProperties } from 'react'
import { useIntl } from 'react-intl'

import { Button, Card, Typography, Space } from '@open-condo/ui'

import styles from './B2BAppCard.module.css'

type AppCardProps = { img: string, title: string, description?: string | null }

const CARD_BODY_PADDINGS = 20
const CARD_HEAD_PADDINGS = '32px 40px'
const TEXT_MARGIN = 8
const BUTTON_MARGIN = 16
const TEXT_ELLIPSIS_CONFIG = { rows: 2 }
const IMAGE_STYLES: CSSProperties = { objectFit: 'contain', height: 60 }

const AppCardTitle: React.FC<{ img: string }> = ({ img }) => {
    return (
        <div className={styles.logoContainer}>
            <Image
                src={img}
                fallback={img}
                preview={false}
                style={IMAGE_STYLES}
                draggable={false}
            />
        </div>
    )
}

export const B2BAppCard: React.FC<AppCardProps> = ({ img, title, description }) => {
    const intl = useIntl()
    const MoreMessage = intl.formatMessage({ id: 'components.miniapp.appCard.actions.more' })

    return (
        <Card
            bodyPadding={CARD_BODY_PADDINGS}
            titlePadding={CARD_HEAD_PADDINGS}
            title={<AppCardTitle img={img} />}
            className={styles.appCard}
        >
            <Space direction='vertical' size={BUTTON_MARGIN} className={styles.bodySpace}>
                <Space direction='vertical' size={TEXT_MARGIN} className={styles.cardTextSpace}>
                    <Typography.Title level={4} ellipsis={TEXT_ELLIPSIS_CONFIG}>
                        {title}
                    </Typography.Title>
                    {description && (
                        <Typography.Paragraph size='medium' type='secondary' ellipsis={TEXT_ELLIPSIS_CONFIG}>
                            {description}
                        </Typography.Paragraph>
                    )}
                </Space>
                <Button
                    type='secondary'
                    block
                    disabled
                >
                    {MoreMessage}
                </Button>
            </Space>
        </Card>
    )
}