import { Upload, UploadFile, UploadProps } from 'antd'
import getConfig from 'next/config'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { buildMeta, upload as uploadFiles } from '@open-condo/files'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { EXECUTION_AI_FLOW_TASK_FILE_MODEL_NAME } from '@condo/domains/ai/constants'
import { useChatWithCondoAttachmentsConfig } from '@condo/domains/ai/hooks/useChatWithCondoAttachmentsConfig'
import { analytics } from '@condo/domains/common/utils/analytics'

import type { RcFile } from 'antd/lib/upload/interface'

const { publicRuntimeConfig: { fileClientId } } = getConfig()

export type AIChatAttachmentMeta = {
    id: string
    name: string
    mimeType: string
    size: number
}

type UseAIChatAttachmentsOptions = {
    onFileListChange?: () => void
}

export type UseAIChatAttachmentsResult = {
    fileList: UploadFile[]
    readyAttachments: AIChatAttachmentMeta[]
    resetAttachments: () => void
    removeAttachmentFile: (file: UploadFile) => void
    extensions: string
    handleBeforeUpload: (file: RcFile) => boolean | typeof Upload.LIST_IGNORE
    handleUploadRequest: NonNullable<UploadProps['customRequest']>
    handleUploadFileListChange: UploadProps['onChange']
    uploading: boolean
    canSendWithAttachments: boolean
    maxAttachments: number
    maxFileSizeMb: number
}

export function useAIChatAttachments ({ onFileListChange }: UseAIChatAttachmentsOptions = {}): UseAIChatAttachmentsResult | null {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const attachmentsConfig = useChatWithCondoAttachmentsConfig()

    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [uploading, setUploading] = useState(false)
    const fileListRef = useRef(fileList)
    fileListRef.current = fileList
    const pendingUploadAcceptsRef = useRef(0)

    useEffect(() => {
        if (attachmentsConfig) return
        pendingUploadAcceptsRef.current = 0
        setFileList([])
    }, [attachmentsConfig])

    const readyAttachments = useMemo((): AIChatAttachmentMeta[] => {
        return fileList
            .filter((file) => file.status === 'done' && file.response?.id)
            .map((file) => ({
                id: file.response.id as string,
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
                size: file.size || 0,
            }))
    }, [fileList])

    const resetAttachments = useCallback(() => {
        pendingUploadAcceptsRef.current = 0
        setFileList([])
    }, [])

    const removeAttachmentFile = useCallback((file: UploadFile) => {
        setFileList((prev) => prev.filter((item) => item.uid !== file.uid))
    }, [])

    if (!attachmentsConfig) return null

    const { maxAttachments, maxFileSizeBytes, maxFileSizeMb, extensions } = attachmentsConfig
    const fileTooBigMessage = intl.formatMessage(
        { id: 'component.uploadlist.error.FileTooBig' },
        { maxSizeInMb: maxFileSizeMb },
    )
    const maxFilesMessage = intl.formatMessage(
        { id: 'ai.chat.attachments.maxFiles' },
        { max: maxAttachments },
    )

    const handleBeforeUpload: UseAIChatAttachmentsResult['handleBeforeUpload'] = (file) => {
        if (file.size > maxFileSizeBytes) {
            return Upload.LIST_IGNORE
        }

        const remainingSlots = maxAttachments - fileList.filter((item) => item.status !== 'error').length - pendingUploadAcceptsRef.current
        if (remainingSlots <= 0) {
            return Upload.LIST_IGNORE
        }

        pendingUploadAcceptsRef.current += 1
        return true
    }

    const handleUploadRequest: NonNullable<UploadProps['customRequest']> = async (options) => {
        const { file, onSuccess, onError, onProgress } = options
        const rcFile = file as RcFile

        pendingUploadAcceptsRef.current = Math.max(0, pendingUploadAcceptsRef.current - 1)

        if (!user?.id || !fileClientId) {
            onError?.(new Error('Upload is not available'))
            return
        }

        if (rcFile.size > maxFileSizeBytes) {
            onError?.(new Error(fileTooBigMessage))
            return
        }

        if (fileListRef.current.filter((file) => file.status !== 'error').length >= maxAttachments) {
            onError?.(new Error(maxFilesMessage))
            return
        }

        setUploading(true)
        onProgress?.({ percent: 10 })

        try {
            const senderInfo = getClientSideSenderInfo()
            const uploadResult = await uploadFiles({
                files: [rcFile],
                meta: buildMeta({
                    userId: user.id,
                    fileClientId,
                    modelNames: [EXECUTION_AI_FLOW_TASK_FILE_MODEL_NAME],
                    fingerprint: senderInfo.fingerprint,
                    organizationId: organization?.id,
                }),
            })

            const uploaded = uploadResult.files[0]
            if (!uploaded?.id) {
                throw new Error('Upload failed')
            }

            analytics.track('ai_assistant_attachment_upload', {
                mime_type: (rcFile.type || '').replace(/\s/g, '').split(';')[0].toLowerCase(),
                size: rcFile.size,
            })

            onProgress?.({ percent: 100 })
            onSuccess?.({ id: uploaded.id }, null)
        } catch (error) {
            onError?.(error as Error)
        } finally {
            setUploading(false)
        }
    }

    const handleUploadFileListChange: UploadProps['onChange'] = ({ fileList: nextFileList }) => {
        const trimmed = nextFileList.slice(0, maxAttachments)
        setFileList(trimmed)
        onFileListChange?.()
    }

    const hasPendingUploads = fileList.some((file) => file.status === 'uploading')
    const hasUploadErrors = fileList.some((file) => file.status === 'error')

    return {
        fileList,
        readyAttachments,
        resetAttachments,
        removeAttachmentFile,
        extensions,
        handleBeforeUpload,
        handleUploadRequest,
        handleUploadFileListChange,
        uploading: uploading || hasPendingUploads,
        canSendWithAttachments: readyAttachments.length > 0 && !hasPendingUploads && !hasUploadErrors,
        maxAttachments,
        maxFileSizeMb,
    }
}
