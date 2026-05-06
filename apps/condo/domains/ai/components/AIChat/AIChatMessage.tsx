import React, { useCallback, useState } from 'react'

import { Check, Copy, Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Dropdown, Markdown, Tooltip, Typography } from '@open-condo/ui'

import styles from './AIChat.module.css'
import { exportAIChatMessage } from './exportAIChatMessage'

import type { Message } from './AIChat'

export type AIChatMessageProps = {
    message: Message
    onSuggestionClick?: (suggestion: string) => void
    canExecuteAIFlow?: boolean
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({
    message,
    onSuggestionClick,
    canExecuteAIFlow = true,
}) => {
    const intl = useIntl()
    const [copied, setCopied] = useState(false)
    const [exportLoadingByFormat, setExportLoadingByFormat] = useState<Record<'md' | 'pdf' | 'docx', boolean>>({
        md: false,
        pdf: false,
        docx: false,
    })

    const copyLabel = intl.formatMessage({ id: 'Copy' })
    const copiedLabel = intl.formatMessage({ id: 'Copied' })
    const downloadLabel = intl.formatMessage({ id: 'Download' })

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

    const handleExport = useCallback(async (format: 'md' | 'pdf' | 'docx') => {
        if (exportLoadingByFormat[format]) return

        setExportLoadingByFormat((prev) => ({ ...prev, [format]: true }))

        try {
            await exportAIChatMessage({
                format,
                text: message.content.text,
            })
        } catch (e) {
            console.error(`Unable to export message to ${format}`, e)
        } finally {
            setExportLoadingByFormat((prev) => ({ ...prev, [format]: false }))
        }
    }, [exportLoadingByFormat, message.content.text])

    const isExporting = exportLoadingByFormat.md || exportLoadingByFormat.pdf || exportLoadingByFormat.docx

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

    const downloadButton = (
        <Dropdown
            trigger={['click']}
            menu={{
                items: [
                    { key: 'md', label: `${downloadLabel} MD` },
                    { key: 'pdf', label: `${downloadLabel} PDF` },
                    { key: 'docx', label: `${downloadLabel} DOCX` },
                ],
                onClick: ({ key }) => void handleExport(key as 'md' | 'pdf' | 'docx'),
            }}
            disabled={isExporting}
            placement='bottomLeft'
        >
            <Tooltip title={downloadLabel}>
                <Button
                    type='secondary'
                    compact
                    minimal
                    size='medium'
                    icon={<Download size='small' />}
                    loading={isExporting}
                    aria-label={downloadLabel}
                />
            </Tooltip>
        </Dropdown>
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
                        <div className={styles.assistantMessageActions}>
                            {copyButton}
                            {downloadButton}
                        </div>
                    )}
                    {message.content.suggestions?.length > 0 && (
                        <div className={styles.assistantSuggestions}>
                            {message.content.suggestions.map((suggestion) => (
                                <Button
                                    key={`${message.id}-${suggestion}`}
                                    type='secondary'
                                    size='medium'
                                    disabled={!canExecuteAIFlow}
                                    onClick={() => onSuggestionClick?.(suggestion)}
                                >
                                    {suggestion}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
