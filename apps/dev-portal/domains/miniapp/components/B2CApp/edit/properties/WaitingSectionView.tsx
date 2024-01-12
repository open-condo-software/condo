import { Empty } from 'antd'
import Image from 'next/image'
import React, { CSSProperties } from 'react'
import { useIntl } from 'react-intl'

import { Space, Typography } from '@open-condo/ui'

import styles from './WaitingSectionView.module.css'

const IMG_SIZE = 160
const IMAGE_STYLES: CSSProperties = { height: IMG_SIZE }

export const WaitingSectionView: React.FC = () => {
    const intl = useIntl()
    const ManagementNotAvailableTitle = intl.formatMessage({ id: 'apps.b2c.sections.properties.waitingView.title' })
    const ManagementNotAvailableText = intl.formatMessage({ id: 'apps.b2c.sections.properties.waitingView.text' })

    return (
        <Empty
            image={
                <Image src='/dino/waiting@2x.png' alt='Dinosaur waiting' width={IMG_SIZE} height={IMG_SIZE} draggable={false} className={styles.image}/>
            }
            imageStyle={IMAGE_STYLES}
            description={null}
        >
            <Space direction='vertical' size={8} align='center' className={styles.textsContainer}>
                <Typography.Title level={3}>{ManagementNotAvailableTitle}</Typography.Title>
                <Typography.Paragraph type='secondary'>{ManagementNotAvailableText}</Typography.Paragraph>
            </Space>
        </Empty>
    )
}