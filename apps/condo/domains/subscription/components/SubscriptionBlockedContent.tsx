import Image from 'next/image'
import React from 'react'

import { Space, Typography } from '@open-condo/ui'

import styles from './SubscriptionBlockedContent.module.css'


type SubscriptionBlockedContentProps = {
    title: string
    description: React.ReactNode
    primaryButton: React.ReactNode
    secondaryButton?: React.ReactNode
}

export const SubscriptionBlockedContent: React.FC<SubscriptionBlockedContentProps> = ({
    title,
    description,
    primaryButton,
    secondaryButton,
}) => (
    <div className={styles.container}>
        <div className={styles.contentWrapper}>
            <Space direction='vertical' align='center' size={24}>
                <Image src='/mascot/upgradePlan.webp' alt='' width={240} height={240} className={styles.mascot} />
                <Space size={16} direction='vertical'>
                    <Typography.Title level={3}>{title}</Typography.Title>
                    <Typography.Paragraph type='secondary'>{description}</Typography.Paragraph>
                </Space>
                <Space size={16} direction='vertical' align='center'>
                    {primaryButton}
                    {secondaryButton}
                </Space>
            </Space>
        </div>
    </div>
)
