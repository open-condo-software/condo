import { Divider } from 'antd'
import React from 'react'

import { Typography } from '@open-condo/ui'

import styles from './SubDivider.module.css'

type SubDividerProps = {
    title: string
}

export const SubDivider: React.FC<SubDividerProps> = ({ title }) => {
    return (
        <Divider orientation='left' orientationMargin={0} className={styles.subDivider}>
            <Typography.Title level={4}>
                {title}
            </Typography.Title>
        </Divider>
    )
}