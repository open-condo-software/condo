import classnames from 'classnames'
import React from 'react'

import { Card, Checkbox, Typography } from '@open-condo/ui'

import styles from './AppCard.module.css'

type AppCardProps = {
    checked?: boolean
    icon: React.ReactNode
    title: string | React.ReactNode
    subtitle: string | React.ReactNode
    disabled?: boolean
    onClick: () => void
}

const TITLE_ELLIPSIS = { rows: 2 }
const SUBTITLE_ELLIPSIS = { rows: 3 }

export const AppCard: React.FC<AppCardProps> = ({ checked, icon, title, subtitle, onClick, disabled }) => {
    const className = classnames('condo-card-checkbox-type', {
        'condo-card-checked': checked,
    })

    return (
        <Card className={className} onClick={onClick} disabled={disabled}>
            <div className={styles.cardTopRowContainer}>
                <div className={styles.cardIconContainer}>
                    {icon}
                </div>
                <Checkbox checked={checked}/>
            </div>
            <div className={styles.cardTextContainer}>
                <Typography.Title level={4} ellipsis={TITLE_ELLIPSIS}>{title}</Typography.Title>
                <Typography.Paragraph type='secondary' size='medium' ellipsis={SUBTITLE_ELLIPSIS}>{subtitle}</Typography.Paragraph>
            </div>
        </Card>
    )
}