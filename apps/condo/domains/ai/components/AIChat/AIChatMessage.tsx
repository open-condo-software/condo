import React, { useCallback, useRef, useState } from 'react'

import { Check, Copy, Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Dropdown, Markdown, Tooltip, Typography } from '@open-condo/ui'

import { AIChatDocument } from '@condo/domains/ai/components/AIChatFile'
import { exportAIMessage, type ExportAIMessageFormat, type ExportAIMessageOptions } from '@condo/domains/ai/utils/exportAIMessage'
import { stripMarkdown } from '@condo/domains/common/utils/stripMarkdown'

import styles from './AIChat.module.css'

import type { Message } from './AIChat'

const COPY_RESET_TIMEOUT_MS = 2000
const EXPORT_MENU_FORMATS: ExportAIMessageFormat[] = ['docx', 'pdf', 'txt']

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
    const assistantMarkdownRef = useRef<HTMLDivElement>(null)
    const [copied, setCopied] = useState(false)
    const [exportLoadingByFormat, setExportLoadingByFormat] = useState<Record<ExportAIMessageFormat, boolean>>({
        txt: false,
        pdf: false,
        docx: false,
    })

    const copyLabel = intl.formatMessage({ id: 'Copy' })
    const copiedLabel = intl.formatMessage({ id: 'Copied' })
    const downloadLabel = intl.formatMessage({ id: 'Download' })
    const exportMenuItems = EXPORT_MENU_FORMATS.map((format) => ({
        key: format,
        label: `${downloadLabel} ${format.toUpperCase()}`,
    }))

    const handleCopy = useCallback(async () => {
        if (copied) return

        const textToCopy = message.role === 'assistant'
            ? stripMarkdown(message.content.text, { collapseLineBreaks: false })
            : message.content.text

        try {
            await navigator.clipboard.writeText(textToCopy)
            setCopied(true)

            setTimeout(() => setCopied(false), COPY_RESET_TIMEOUT_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, message.content.text, message.role])

    const handleExport = useCallback(async (format: ExportAIMessageFormat) => {
        if (exportLoadingByFormat[format]) return

        setExportLoadingByFormat((prev) => ({ ...prev, [format]: true }))

        try {
            let payload: ExportAIMessageOptions
            if (format === 'pdf') {
                const el = assistantMarkdownRef.current
                if (!el) {
                    console.error('Unable to export PDF: markdown root is not mounted')
                    return
                }
                payload = { format: 'pdf', pdfSourceElement: el }
            } else {
                payload = { format, text: message.content.text }
            }
            await exportAIMessage(payload)
        } catch (e) {
            console.error('Unable to export message', { format, error: e })
        } finally {
            setExportLoadingByFormat((prev) => ({ ...prev, [format]: false }))
        }
    }, [exportLoadingByFormat, message.content.text])

    const isExporting = exportLoadingByFormat.txt || exportLoadingByFormat.pdf || exportLoadingByFormat.docx

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
                items: exportMenuItems,
                onClick: ({ key }) => void handleExport(key as ExportAIMessageFormat),
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
                    <div className={styles.userMessageRow}>
                        {message.copyable === true && message.content.text?.trim() && (
                            <div className={styles.userMessageActions}>{copyButton}</div>
                        )}
                        {(message.content.text?.trim() || message.content.attachments?.length) ? (
                            <div className={styles.userMessageBubble}>
                                {message.content.text?.trim() ? (
                                    <Typography.Text>{message.content.text}</Typography.Text>
                                ) : null}
                                {message.content.attachments?.length ? (
                                    <div className={styles.userMessageAttachments}>
                                        {message.content.attachments.map((attachment, index) => (
                                            <AIChatDocument
                                                key={`${attachment.name}-${index}`}
                                                name={attachment.name}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className={styles.assistantMessageContainer}>
                    <div ref={assistantMarkdownRef} className={styles.assistantMarkdown}>
                        <Markdown type='inline'>{message.content.text}</Markdown>
                    </div>
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
                                    type='primary'
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
