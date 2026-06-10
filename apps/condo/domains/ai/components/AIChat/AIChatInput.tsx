import { Upload } from 'antd'
import React, { useMemo } from 'react'

import { Paperclip } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Space, Tooltip } from '@open-condo/ui'

import { AIChatDocument } from '@condo/domains/ai/components/AIChatFile'

import styles from './AIChatInput.module.css'

import type { UseAIChatAttachmentsResult } from '@condo/domains/ai/hooks/useAIChatAttachments'


type AIChatInputProps = {
    containerRef?: React.RefObject<HTMLDivElement>
    attachments: UseAIChatAttachmentsResult | null
    canExecuteAIFlow: boolean
    canSendMessage: boolean
    inputRef: React.RefObject<any>
    inputValue: string
    onInputChange: (nextValue: string) => void
    onInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    onSendMessage: () => void
    placeholder: string
}

export const AIChatInput: React.FC<AIChatInputProps> = ({
    containerRef,
    attachments,
    canExecuteAIFlow,
    canSendMessage,
    inputRef,
    inputValue,
    onInputChange,
    onInputKeyDown,
    onSendMessage,
    placeholder,
}) => {
    const intl = useIntl()
    const attachmentsUploading = attachments ? attachments.uploading : false
    const attachmentsUploadDisabled = attachments
        ? !canExecuteAIFlow || attachmentsUploading || attachments.fileList.length >= attachments.maxAttachments
        : true
    const attachmentsRemoveDisabled = !canExecuteAIFlow || attachmentsUploading

    const attachmentsTooltip = useMemo(() => {
        if (!attachments) return ''

        const addFilesTitle = intl.formatMessage({ id: 'ai.chat.attachments.tooltip.addFilesTitle' })
        const maxFileSizeMessage = intl.formatMessage(
            { id: 'ai.chat.attachments.tooltip.limits' },
            { max: attachments.maxAttachments, maxFileSizeMb: attachments.maxFileSizeMb },
        )
        const textOnlyMessage = intl.formatMessage({ id: 'ai.chat.attachments.tooltip.textOnly' })

        return <div>{addFilesTitle}<br/>{maxFileSizeMessage}<br/>{textOnlyMessage}</div>
    }, [intl, attachments])

    return (
        <div ref={containerRef} className={styles.inputContainer}>
            <Space direction='vertical' size={8} width='100%'>
                <div className={styles.attachmentsContainer}>
                    {attachments && attachments.fileList.length > 0 && (
                        <div className={styles.attachmentContainer}>
                            {attachments.fileList.map((file) => (
                                <AIChatDocument
                                    key={file.uid}
                                    name={file.name}
                                    status={file.status === 'uploading' || file.status === 'error' || file.status === 'done' ? file.status : undefined}
                                    onRemove={() => attachments.removeAttachmentFile(file)}
                                    removeDisabled={attachmentsRemoveDisabled}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className={styles.textAreaContainer}>
                    <Input.TextArea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={onInputKeyDown}
                        onSubmit={onSendMessage}
                        placeholder={placeholder}
                        disabled={!canExecuteAIFlow}
                        isSubmitDisabled={!canSendMessage || !canExecuteAIFlow}
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        bottomPanelUtils={attachments ? [
                            <Upload
                                key='ai-chat-attachment-upload-trigger'
                                multiple
                                showUploadList={false}
                                accept={attachments.extensions}
                                fileList={attachments.fileList}
                                beforeUpload={attachments.handleBeforeUpload}
                                customRequest={attachments.handleUploadRequest}
                                onChange={attachments.handleUploadFileListChange}
                                disabled={attachmentsUploadDisabled}
                            >
                                <Tooltip title={attachmentsTooltip} placement='top'>
                                    <Button
                                        type='secondary'
                                        size='medium'
                                        minimal
                                        compact
                                        disabled={attachmentsUploadDisabled}
                                        icon={<Paperclip size='small' />}
                                    />
                                </Tooltip>
                            </Upload>,
                        ] : []}
                    />
                </div>
            </Space>
        </div>
    )
}
