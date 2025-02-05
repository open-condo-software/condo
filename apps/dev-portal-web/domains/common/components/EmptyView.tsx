import { Empty } from 'antd'
import React from 'react'

import { Typography, Space, Button } from '@open-condo/ui'

import styles from './EmptyView.module.css'

type EmptyViewProps = {
    title: string
    description: string
    actionLabel: string
    onAction: () => void
}

export const EmptyView: React.FC<EmptyViewProps> = ({ title, description, actionLabel, onAction }) => {
    return (
        <Empty
            image='/dino/searching@2x.png'
            className={styles.emptyView}
            description={null}
        >
            <Space direction='vertical' size={24} align='center'>
                <Space direction='vertical' size={12} align='center'>
                    <Typography.Title level={3}>{title}</Typography.Title>
                    <Typography.Text type='secondary'>{description}</Typography.Text>
                </Space>
                <Button type='secondary' onClick={onAction}>{actionLabel}</Button>
            </Space>
        </Empty>
    )
}