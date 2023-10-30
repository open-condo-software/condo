import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { Settings } from '@open-condo/icons'
import { Card, Typography } from '@open-condo/ui'

import styles from './InlineAppCard.module.css'

const TITLE_ELLIPSIS = {
    rows: 2,
}

type InlineAppCardProps =  {
    id: string
    name: string
    type: string
}

export const InlineAppCard: React.FC<InlineAppCardProps> = ({ name, type, id }) => {
    const router = useRouter()
    const handleCardClick = useCallback(() => {
        const url = `/apps/${type}/${id}`
        router.push(url, url, { locale: router.locale })
    }, [id, type, router])

    return (
        <Card bodyPadding={12} hoverable onClick={handleCardClick}>
            <div className={styles.appCardContentContainer}>
                <div className={styles.appCardLogoColContainer}>
                    <div className={styles.appCardLogoContainer}>
                        {/*  TODO: ICON FILL  */}
                    </div>
                    <Typography.Text size='small' type='secondary'>{type.toUpperCase()}</Typography.Text>
                </div>
                <div>
                    <Typography.Paragraph ellipsis={TITLE_ELLIPSIS}>
                        {name}
                    </Typography.Paragraph>
                </div>
                <div className={styles.appCardIconsContainer}>
                    <Settings size='small' className={styles.appCardIcon}/>
                </div>
            </div>
        </Card>
    )
}
