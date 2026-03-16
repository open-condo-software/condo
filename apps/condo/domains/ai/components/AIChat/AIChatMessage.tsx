import React from 'react'

import { Typography } from '@open-condo/ui'
import { Markdown } from '@open-condo/ui'

import styles from './AIChat.module.css'

import type { Message } from './AIChat'

export type AIChatMessageProps = {
    message: Message
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
    return (
        <div className={`${styles.messageWrapper} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
            {message.role === 'user' ? (
                <div className={styles.userMessageContainer}>
                    <div className={styles.userMessageBubble}>
                        <Typography.Text>{message.content.text}</Typography.Text>
                    </div>
                </div>
            ) : (
                <div className={styles.assistantMessageContainer}>
                    <Markdown type='inline'>{message.content.text}</Markdown>
                </div>
            )}
        </div>
    )
}
