import Image from 'next/image'
import React from 'react'

import { Space, Typography } from '@open-condo/ui'

import styles from './EmptyTableFiller.module.css'

const IMG_SIZE = 100

export const EmptyTableFiller: React.FC<{ message: string }> = ({ message }) => {
    return (
        <Space size={4} direction='vertical' align='center'>
            <Image src='/dino/searching@2x.png' alt='no data logo' width={IMG_SIZE} height={IMG_SIZE} draggable={false} className={styles.fillerImage}/>
            <Typography.Paragraph type='secondary' size='medium'>
                {message}
            </Typography.Paragraph>
        </Space>
    )
}