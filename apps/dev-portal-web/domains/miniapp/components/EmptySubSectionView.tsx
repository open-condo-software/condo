import { Empty } from 'antd'
import Image from 'next/image'
import React, { CSSProperties } from 'react'

import { Space, Typography } from '@open-condo/ui'

import styles from './EmptySubSectionView.module.css'

const IMG_SIZE = 160
const IMAGE_STYLES: CSSProperties = { height: IMG_SIZE }

type EmptySubSectionViewProps = {
    image: string
    title?: string
    description?: string
    actions?: Array<React.ReactElement>
}

export const EmptySubSectionView: React.FC<EmptySubSectionViewProps> = ({
    image,
    title,
    description,
    actions,
}) => {
    return (
        <Empty
            image={
                <Image src={image} alt='Mascot' width={IMG_SIZE} height={IMG_SIZE} draggable={false} className={styles.image}/>
            }
            imageStyle={IMAGE_STYLES}
            description={null}
        >
            <Space direction='vertical' size={8} align='center' className={styles.textsContainer}>
                {title && <Typography.Title level={3}>{title}</Typography.Title>}
                {description && <Typography.Paragraph type='secondary'>{description}</Typography.Paragraph>}
                {(actions) && (
                    <div className={styles.actionsContainer}>
                        {actions}
                    </div>
                )}
            </Space>
        </Empty>
    )
}
