import React, { useCallback, useState } from 'react'

import { Check, Copy } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Markdown, Tooltip, Typography } from '@open-condo/ui'

import styles from './AIChat.module.css'

import type { Message } from './AIChat'

export type AIChatMessageProps = {
    message: Message
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
    const intl = useIntl()
    const [copied, setCopied] = useState(false)

    const copyLabel = intl.formatMessage({ id: 'Copy' })
    const copiedLabel = intl.formatMessage({ id: 'Copied' })

    const handleCopy = useCallback(async () => {
        if (copied) return

        try {
            await navigator.clipboard.writeText(message.content.text)
            setCopied(true)

            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, message.content.text])

    const copyButton = (
        <Tooltip title={copied ? copiedLabel : copyLabel}>
            <Button
                type='secondary'
                compact
                minimal
                size='medium'
                icon={copied ? <Check size='small' /> : <Copy size='small' />}
                onClick={handleCopy}
                disabled={copied}
                aria-label={copied ? copiedLabel : copyLabel}
            />
        </Tooltip>
    )

    return (
        <div className={`${styles.messageWrapper} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
            {message.role === 'user' ? (
                <div className={styles.userMessageContainer}>
                    {message.copyable === true && (
                        <div className={styles.userMessageActions}>{copyButton}</div>
                    )}
                    <div className={styles.userMessageBubble}>
                        <Typography.Text>{message.content.text}</Typography.Text>
                    </div>
                </div>
            ) : (
                <div className={styles.assistantMessageContainer}>
                    <Markdown type='inline'>{message.content.text}</Markdown>
                    {message.copyable === true && message.status !== 'sending' && (
                        <div className={styles.assistantMessageActions}>{copyButton}</div>
                    )}
                </div>
            )}
        </div>
    )
}
