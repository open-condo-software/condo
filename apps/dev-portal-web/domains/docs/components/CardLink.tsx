import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { Card, Space, Typography } from '@open-condo/ui'

import styles from './CardLink.module.css'

const ELLIPSIS_CONFIG = { rows: 3 }

type CardLinkProps = {
    title: string
    description?: string
    href: string
}

export const CardLink = ({ title, description, href }: CardLinkProps): React.ReactElement => {
    const router = useRouter()
    const handleClick = useCallback(() => {
        router.push(href, href, { locale: router.locale })
    }, [router, href])
    return (
        <Card hoverable onClick={handleClick}>
            <Space direction='vertical' size={8}>
                <Typography.Title level={4}>{title}</Typography.Title>
                <div className={styles.descriptionContainer}>
                    {description && (
                        <Typography.Paragraph title={description} ellipsis={ELLIPSIS_CONFIG} type='secondary'>{description}</Typography.Paragraph>
                    )}
                </div>
            </Space>
        </Card>
    )
}