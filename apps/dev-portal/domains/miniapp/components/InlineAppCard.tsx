import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { Card, Typography } from '@open-condo/ui'

import styles from './InlineAppCard.module.css'

import type { AppInfo } from '@/domains/miniapp/utils/merge'

const IMG_SIZE = 44
const TITLE_ELLIPSIS = {
    rows: 2,
}

export const InlineAppCard: React.FC<AppInfo> = ({ name, type, id, logo }) => {
    const router = useRouter()
    const handleCardClick = useCallback(() => {
        const url = `/apps/${type}/${id}`
        router.push(url, url, { locale: router.locale })
    }, [id, type, router])

    return (
        <Card bodyPadding={12} hoverable onClick={handleCardClick}>
            <div className={styles.appCardContentContainer}>
                <div className={styles.appCardLogoContainer}>
                    {logo && (
                        <Image src={logo} alt='application logo' width={IMG_SIZE} height={IMG_SIZE} className={styles.appLogo} draggable={false}/>
                    )}
                </div>
                <Typography.Paragraph ellipsis={TITLE_ELLIPSIS}>
                    {name}
                </Typography.Paragraph>
            </div>
        </Card>
    )
}
