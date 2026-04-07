import React from 'react'

import { Typography, Markdown } from '@open-condo/ui'

import styles from './AIChat.module.css'

import type { Message } from './AIChat'

export type AIChatMessageProps = {
    message: Message
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
    const messageText = message?.content?.text || ''

    return (
        <div className={`${styles.messageWrapper} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
            {message.role === 'user' ? (
                <div className={styles.userMessageContainer}>
                    <div className={styles.userMessageBubble}>
                        <Typography.Text>{messageText}</Typography.Text>
                    </div>
                </div>
            ) : (
                <div className={styles.assistantMessageContainer}>
                    <Markdown type='inline'>{messageText}</Markdown>
                </div>
            )}
        </div>
    )
}
