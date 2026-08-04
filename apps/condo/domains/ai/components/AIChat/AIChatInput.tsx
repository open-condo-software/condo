import { Upload } from 'antd'
import React, { useCallback, useMemo } from 'react'

import { Close, Paperclip } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Space, Tooltip, Typography } from '@open-condo/ui'

import { AIChatDocument } from '@condo/domains/ai/components/AIChatFile'
import { useSpeechToText } from '@condo/domains/ai/hooks/useSpeechToText'
import { ProgressLoader } from '@condo/domains/common/components/ProgressLoader'

import styles from './AIChatInput.module.css'
import { SpeechAudioWaveform } from './SpeechAudioWaveform'
import { SpeechMicIcon } from './SpeechMicIcon'
import { SpeechStopIcon } from './SpeechStopIcon'

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
    onSendMessage: () => void | Promise<void>
    onTranscript: (text: string) => void
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
    onTranscript,
    placeholder,
}) => {
    const intl = useIntl()
    const attachmentsUploading = attachments ? attachments.uploading : false
    const attachmentsUploadDisabled = attachments
        ? !canExecuteAIFlow || attachmentsUploading || attachments.fileList.length >= attachments.maxAttachments
        : true
    const attachmentsRemoveDisabled = !canExecuteAIFlow || attachmentsUploading

    const {
        status: speechStatus,
        isSupported: isSpeechSupported,
        isBusy: isSpeechBusy,
        errorMessage: speechErrorMessage,
        mediaStream,
        tooltipTitle: speechTooltipTitle,
        toggleRecording,
        clearError,
    } = useSpeechToText({
        enabled: canExecuteAIFlow,
        onTranscript,
    })

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

    const handleMicClick = useCallback(() => {
        void toggleRecording()
    }, [toggleRecording])

    const micDisabled = !canExecuteAIFlow
        || !isSpeechSupported
        || speechStatus === 'processing'
        || attachmentsUploading

    const bottomPanelUtils = useMemo(() => {
        const utils: React.ReactNode[] = []

        if (attachments) {
            utils.push(
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
            )
        }

        if (speechStatus === 'processing') {
            utils.push(
                <span
                    key='ai-chat-speech-processing'
                    className={styles.speechProcessingLoader}
                    role='status'
                    aria-live='polite'
                >
                    <ProgressLoader />
                </span>,
            )
        } else if (speechStatus === 'recording') {
            utils.push(
                <div
                    key='ai-chat-speech-recording'
                    className={styles.speechInlineControls}
                >
                    {mediaStream && (
                        <SpeechAudioWaveform stream={mediaStream} compact />
                    )}
                    <Tooltip title={speechTooltipTitle} placement='top'>
                        <Button
                            type='primary'
                            size='medium'
                            minimal
                            compact
                            className={styles.speechStopButton}
                            icon={<SpeechStopIcon size='small' />}
                            onClick={handleMicClick}
                            aria-label={speechTooltipTitle}
                        />
                    </Tooltip>
                </div>,
            )
        } else {
            utils.push(
                <Tooltip key='ai-chat-speech-to-text' title={speechTooltipTitle} placement='top'>
                    <Button
                        type='secondary'
                        size='medium'
                        minimal
                        compact
                        disabled={micDisabled}
                        icon={<SpeechMicIcon size='small' />}
                        onClick={handleMicClick}
                        aria-label={speechTooltipTitle}
                    />
                </Tooltip>,
            )
        }

        return utils
    }, [
        attachments,
        attachmentsTooltip,
        attachmentsUploadDisabled,
        handleMicClick,
        mediaStream,
        micDisabled,
        speechStatus,
        speechTooltipTitle,
    ])

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

                {speechErrorMessage
                    && speechStatus !== 'recording'
                    && speechStatus !== 'processing' && (
                    <div
                        className={styles.speechErrorBanner}
                        role='alert'
                    >
                        <Typography.Text size='small' type='danger'>
                            {speechErrorMessage}
                        </Typography.Text>
                        <Button
                            type='secondary'
                            size='medium'
                            minimal
                            compact
                            icon={<Close size='small' />}
                            onClick={clearError}
                            aria-label={intl.formatMessage({ id: 'ai.chat.speechToText.error.dismiss' })}
                        />
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
                        disabled={!canExecuteAIFlow || speechStatus === 'processing'}
                        isSubmitDisabled={!canSendMessage || !canExecuteAIFlow || isSpeechBusy}
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        bottomPanelUtils={bottomPanelUtils}
                    />
                </div>
            </Space>
        </div>
    )
}
