import React from 'react'
import { useIntl } from 'react-intl'

import { Card, Typography } from '@open-condo/ui'

import styles from './InlineAppCard.module.css'

type InlineAppCardProps =  {
    name: string
    type: string
}

export const InlineAppCard: React.FC<InlineAppCardProps> = ({ name, type }) => {
    const intl = useIntl()
    const EditMessage = intl.formatMessage({ id: 'miniapp.card.edit.message' })

    return (
        <Card bodyPadding={20} hoverable>
            <div className={styles.appCardContentContainer}>
                <span>
                    <Typography.Paragraph ellipsis>{name}</Typography.Paragraph>&nbsp;({type.toUpperCase()})
                </span>
                <span className={styles.editMessageContainer}>
                    <Typography.Link>
                        {EditMessage}
                    </Typography.Link>
                </span>
            </div>
        </Card>
    )
}
