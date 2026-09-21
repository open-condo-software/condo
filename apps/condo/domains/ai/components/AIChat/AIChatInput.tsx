import { Document as DocumentType } from '@app/condo/schema'
import React, { useCallback, useMemo } from 'react'

import { Paperclip } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Space, Tooltip, Dropdown } from '@open-condo/ui'

import { AIChatDocumentWithDocumentEdition } from '@condo/domains/ai/components/AIChatFile'

import styles from './AIChatInput.module.css'
import { SelectFiles } from './SelectFiles'
import { UploadFiles } from './UploadFiles'

import type { ChatWithCondoAttachmentsConfig } from '@condo/domains/ai/hooks/useChatWithCondoAttachmentsConfig'


type AIChatInputProps = {
    containerRef?: React.RefObject<HTMLDivElement>
    attachments: ChatWithCondoAttachmentsConfig | null
    canExecuteAIFlow: boolean
    canSendMessage: boolean
    inputRef: React.RefObject<any>
    inputValue: string
    onInputChange: (nextValue: string) => void
    onInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    onSendMessage: () => void | Promise<void>
    placeholder: string
    extraBottomPanelUtils?: React.ReactElement[]
    autoSize?: { minRows: number, maxRows: number }
    attachedFiles: Array<DocumentType & { name: string }>
    setAttachedFiles: React.Dispatch<React.SetStateAction<(DocumentType & {
        name: string
    })[]>>
    showFileSelection: boolean
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
    extraBottomPanelUtils,
    autoSize = { minRows: 1, maxRows: 4 },
    attachedFiles,
    setAttachedFiles,
    showFileSelection,
}) => {
    const intl = useIntl()
    const AddedNewFile = intl.formatMessage({ id: 'aiChat.addFile.newFile' })
    const AddedExistingFile = intl.formatMessage({ id: 'aiChat.addFile.existingFile' })

    const attachmentsUploadDisabled = attachments
        ? !canExecuteAIFlow || attachedFiles.length >= attachments.maxAttachments
        : true

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

    const removeAttachmentFile = useCallback((file: DocumentType & { name: string }) => {
        setAttachedFiles((prev) => prev.filter((item) => item.id !== file.id))
    }, [setAttachedFiles])

    const updateAttachmentFile = useCallback((file: DocumentType & { name: string }) => {
        setAttachedFiles((prev) => prev.map((item) => item.id === file.id ? ({ ...file }) : item))
    }, [setAttachedFiles])

    const bottomPanelUtils: React.ComponentProps<typeof Input.TextArea>['bottomPanelUtils'] = useMemo(() => {
        const panelUtils = []

        if (attachments) {
            if (showFileSelection) {
                panelUtils.push(
                    <Dropdown
                        key='dropdown'
                        menu={{
                            items:[{
                                key: 'upload-files',
                                label: (
                                    <UploadFiles
                                        key='ai-chat-attachment-upload-trigger'
                                        attachments={attachments}
                                        attachedFiles={attachedFiles}
                                        canExecuteAIFlow={canExecuteAIFlow}
                                        onUploadComplete={(uploadedFiles) => {
                                            setAttachedFiles(prevFiles => [...prevFiles, ...uploadedFiles])
                                        }}
                                    >
                                        {AddedNewFile}
                                    </UploadFiles>
                                ),
                            }, {
                                key: 'select-files',
                                label: (
                                    <SelectFiles
                                        key='ai-chat-attachment-upload-trigger-2'
                                        onSelect={(selectedFiles) => {
                                            setAttachedFiles(prevFiles => [...prevFiles, ...selectedFiles])
                                        }}
                                    >
                                        {AddedExistingFile}
                                    </SelectFiles>
                                ),
                            }],
                        }}
                        placement='topLeft'
                    >
                        <Button
                            type='secondary'
                            size='medium'
                            minimal
                            compact
                            icon={<Paperclip size='small' />}
                        />
                    </Dropdown>
                )
            } else {
                panelUtils.push(
                    <UploadFiles
                        key='ai-chat-attachment-upload-trigger'
                        attachments={attachments}
                        attachedFiles={attachedFiles}
                        canExecuteAIFlow={canExecuteAIFlow}
                        onUploadComplete={(uploadedFiles) => {
                            setAttachedFiles(prevFiles => [...prevFiles, ...uploadedFiles])
                        }}
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
                    </UploadFiles>
                )
            }
        }

        if (extraBottomPanelUtils && Array.isArray(extraBottomPanelUtils)) {
            panelUtils.push(...extraBottomPanelUtils)
        }

        return panelUtils
    }, [attachments, extraBottomPanelUtils, showFileSelection, attachedFiles, canExecuteAIFlow, AddedNewFile, AddedExistingFile, setAttachedFiles, attachmentsTooltip, attachmentsUploadDisabled])

    return (
        <div ref={containerRef} className={styles.inputContainer}>
            <Space direction='vertical' size={8} width='100%'>
                {attachments && attachedFiles.length > 0 && (
                    <div className={styles.attachmentsContainer}>
                        <div className={styles.attachmentContainer}>
                            {attachedFiles.map((file) => (
                                <AIChatDocumentWithDocumentEdition
                                    key={file.id}
                                    document={file}
                                    onRemove={removeAttachmentFile}
                                    onUpdate={updateAttachmentFile}
                                />
                            ))}
                        </div>
                    </div>
                )}
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
                        autoSize={autoSize}
                        bottomPanelUtils={bottomPanelUtils}
                    />
                </div>
            </Space>
        </div>
    )
}
