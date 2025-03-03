import Image from 'next/image'
import React from 'react'

import { Typography } from '@open-condo/ui'

import { B2C_LOGO_SIZE } from '@/domains/miniapp/constants/common'

import styles from './B2CAppCard.module.css'

const IMG_SIZE = B2C_LOGO_SIZE / 3
const ELLIPSIS_CONFIG = { rows: 2 }

export const B2CAppCard: React.FC<{ name: string, logo: string }> = ({ name, logo }) => {
    return (
        <div className={`b2c-app-card ${styles.appCard}`}>
            <Image
                src={logo}
                alt='application logo'
                width={IMG_SIZE}
                height={IMG_SIZE}
                draggable={false}
                className={styles.appCardImage}
            />
            <Typography.Title ellipsis={ELLIPSIS_CONFIG} level={6} type='inherit'>{name.toUpperCase()}</Typography.Title>
        </div>
    )
}