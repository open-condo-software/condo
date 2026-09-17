import { Upload, UploadFile, UploadProps } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useState } from 'react'

import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'

import { useSelectFromSavedDocumentsModal } from './SaveDocumentsModal'


const { publicRuntimeConfig: { fileClientId } } = getConfig()

const MAX_FILE_SIZE_IN_MB = MAX_UPLOAD_FILE_SIZE / (1024 * 1024)


export const UploadFiles: React.FC<any> = ({
    attachments,
    attachedFiles,
    canExecuteAIFlow,
    onUploadComplete,
    children,
}) => {
    const attachmentsUploadDisabled = attachments
        ? !canExecuteAIFlow || attachedFiles.length >= attachments.maxAttachments
        : true

    const { SaveDocumentsModal, openSaveDocumentsModal } = useSelectFromSavedDocumentsModal()

    const [fileList, setFileList] = useState<UploadFile[]>([])

    const beforeUpload: UploadProps['beforeUpload'] = useCallback((file) => {
        if (file.size > Math.min(attachments.maxFileSizeMb, MAX_FILE_SIZE_IN_MB) * 1024 * 1024) {
            return false
        }

        const remainingSlots = attachments.maxAttachments - fileList.filter((item) => item.status !== 'error').length
        if (remainingSlots <= 0) {
            return false
        }

        if (fileClientId) {
            const wrapped: UploadFile = {
                uid: file.uid,
                name: file.name,
                originFileObj: file,
                type: file.type,
                size: file.size,
            }
            setFileList(prev => [...prev, wrapped])
        } else {
            setFileList(prev => [...prev, file])
        }

        openSaveDocumentsModal()

        return false
    }, [attachments, fileList, openSaveDocumentsModal])

    return (
        <>
            <SaveDocumentsModal
                fileList={fileList}
                setFileList={setFileList}
                onUploadComplete={onUploadComplete}
            />
            <Upload
                key='ai-chat-attachment-upload-trigger'
                multiple
                showUploadList={false}
                accept={attachments.extensions}
                fileList={fileList}
                beforeUpload={beforeUpload}
                disabled={attachmentsUploadDisabled}
            >
                {children}
            </Upload>
        </>
    )
}