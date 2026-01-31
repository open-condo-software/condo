import React from 'react'

import { Drawer } from 'antd'
import { useIntl } from '@open-condo/next/intl'

import { AIChat } from '../AIChat/AIChat'
import styles from './AIOverlay.module.css'

type AIOverlayProps = {
    open: boolean
    onClose: () => void
}

export const AIOverlay: React.FC<AIOverlayProps> = ({ open, onClose }) => {
    const intl = useIntl()
    const title = intl.formatMessage({ id: 'ai.chat.title' })

    return (
        <Drawer
            title={title}
            placement='right'
            open={open}
            onClose={onClose}
            width={600}
            className={styles.aiOverlay}
        >
            <div className={styles.content}>
                <AIChat onClose={onClose} />
            </div>
        </Drawer>
    )
}
