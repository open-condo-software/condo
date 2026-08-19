import { Document as DocumentType } from '@app/condo/schema'
import { Row, Col, Upload, Form, UploadFile, UploadProps } from 'antd'
import dayjs from 'dayjs'
import set from 'lodash/set'
import getConfig from 'next/config'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { Download, Paperclip, QuestionCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Space, Tooltip, Modal, Typography, Switch } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { AIChatDocument } from '@condo/domains/ai/components/AIChatFile'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { DocumentCategoryFormItem } from '@condo/domains/document/components/DocumentCategoryFormItem'
import { Document } from '@condo/domains/document/utils/clientSchema'

import styles from './AIChatInput.module.css'

import { Table } from '../../../common/components/Table/Index'
import { MAX_UPLOAD_FILE_SIZE } from '../../../common/constants/uploads'

import type { UseAIChatAttachmentsResult } from '@condo/domains/ai/hooks/useAIChatAttachments'




const { publicRuntimeConfig: { fileClientId } } = getConfig()


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

const FILE_WRAPPER_STYLE: CSSProperties = { width: '100%', backgroundColor: colors.gray[1], borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }

const SaveDocumentsModal: React.FC<any> = ({ setModalState, modalState, fileList, setFileList }) => {
    const intl = useIntl()
    const DownloadFileMessage = intl.formatMessage({ id: 'documents.updateDocumentModal.downloadMessage' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const CancelUpdateMessage = intl.formatMessage({ id: 'documents.updateDocumentModal.cancel' })
    const CancelModalTitle = intl.formatMessage({ id: 'documents.updateDocumentModal.cancel.title' })
    const CancelModalMessage = intl.formatMessage({ id: 'documents.updateDocumentModal.cancel.message' })
    const ReadyMessage = intl.formatMessage({ id: 'Ready' })

    const updateAction = Document.useUpdate({})
    const softDeleteAction = Document.useSoftDelete()

    const [formSubmitting, setFormSubmitting] = useState<boolean>(false)
    const [uploadForm] = Form.useForm()

    const { downloadFile } = useDownloadFileFromServer()

    const [loading, setLoading] = useState<boolean>(false)
    const [isSaveFiles, setIsSaveFiles] = useState<boolean>(false)

    const openConfirmCancelModal = useCallback(() => setModalState('confirmCancel'), [])
    const closeModal = useCallback(() => {
        setModalState(null)
        setIsSaveFiles(false)
        setFileList([])
    }, [setModalState, setFileList])

    const saveDocumentsAction = useCallback(async (values) => {
        setLoading(true)

        // TODO

        closeModal()
        setLoading(false)
    }, [closeModal, updateAction])

    return (
        <>
            <FormWithAction
                action={saveDocumentsAction}
                layout='vertical'
                validateTrigger={['onBlur', 'onSubmit']}
                formInstance={uploadForm}
            >
                <Modal
                    width='big'
                    open={modalState === 'save'}
                    onCancel={openConfirmCancelModal}
                    title='Параметры загрузки'
                    footer={(
                        <Space size={16} direction='horizontal' wrap>
                            <Button type='secondary' danger onClick={closeModal}>
                                {SaveMessage}
                            </Button>
                        </Space>
                    )}
                >
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <div style={FILE_WRAPPER_STYLE}>
                                <Tooltip title='В следующий раз сможете выбрать эти файлы из загруженных'>
                                    <Space size={8} direction='horizontal' align='center'>
                                        <Typography.Text>
                                            Сохранить файлы на платформе
                                        </Typography.Text>
                                        <div>
                                            <QuestionCircle size='small'/>
                                        </div>
                                    </Space>
                                </Tooltip>
                                <Switch
                                    checked={isSaveFiles}
                                    onChange={(value) => setIsSaveFiles(value)}
                                    size='small'
                                />
                            </div>
                        </Col>
                        <Col span={24}>
                            {
                                isSaveFiles
                                    ? (
                                        <Table
                                            totalRows={fileList.length}
                                            dataSource={documents}
                                            columns={tableColumns}
                                            onRow={handleRowAction}
                                        />
                                    )
                                    : (
                                        <div className={styles.attachmentContainer}>
                                            {fileList.map((file) => (
                                                <AIChatDocument
                                                    key={file.uid}
                                                    name={file.name}
                                                    status={file.status === 'uploading' || file.status === 'error' || file.status === 'done' ? file.status : undefined}
                                                    // onRemove={() => attachments.removeAttachmentFile(file)}
                                                    // removeDisabled={attachmentsRemoveDisabled}
                                                />
                                            ))}
                                        </div>
                                    )
                            }
                        </Col>
                    </Row>
                </Modal>
            </FormWithAction>
            <Modal
                open={modalState === 'confirmCancel'}
                onCancel={() => setModalState('save')}
                title={CancelModalTitle}
                footer={[
                    <Button key='delete' type='secondary' danger onClick={closeModal}>
                        Не сохранять
                    </Button>,
                    <Button key='cancel' type='secondary' onClick={() => setModalState('save')}>
                        Вернуться к загрузке
                    </Button>,
                ]}
            >
                <Typography.Text type='secondary' size='large'>
                    {CancelModalMessage}
                </Typography.Text>
            </Modal>
        </>
    )
}

const useSelectFromSavedDocumentsModal = () => {
    const [modalState, setModalState] = useState<'save' | 'confirmCancel'>('save')

    const SaveModal = useCallback((props) => (
        <SaveDocumentsModal modalState={modalState} setModalState={setModalState} {...props} />
    ), [modalState, setModalState])

    const setOpen = useCallback(() => {
        setModalState('save')
    }, [])

    return {
        openSaveDocumentsModal: setOpen, SaveDocumentsModal: SaveModal,
    }
}

const useAIChatAttachmentsModals = () => {

    const SelectFromSavedDocumentsModal = useCallback(() => {
        return null
    }, [])


    const SaveDocumentsModal = useCallback(() => {
        return null
    }, [])
}

const UploadFiles: React.FC<any> = ({
    attachments,
    canExecuteAIFlow,
}) => {
    const intl = useIntl()
    const attachmentsUploading = attachments ? attachments.uploading : false
    const attachmentsUploadDisabled = attachments
        ? !canExecuteAIFlow || attachmentsUploading || attachments.fileList.length >= attachments.maxAttachments
        : true
    const attachmentsRemoveDisabled = !canExecuteAIFlow || attachmentsUploading

    const MaxFileSizeMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.files.maxSizeMessage' }, {
        maxFileSizeInMb: MAX_FILE_SIZE_IN_MB,
    })
    const FileTooBigErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.FileTooBig' }, {
        maxSizeInMb: MAX_FILE_SIZE_IN_MB,
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

    const { SaveDocumentsModal, openSaveDocumentsModal } = useSelectFromSavedDocumentsModal()

    const [fileList, setFileList] = useState<UploadFile[]>([])

    const uploadProps: UploadProps = {
        onRemove: (file) => {
            setFileList(prev => prev.filter(f => f.uid !== file.uid))
        },
        beforeUpload: (file) => {
            if (file.size > MAX_UPLOAD_FILE_SIZE) {
                if (fileClientId) {
                    const errored: UploadFile = {
                        uid: file.uid,
                        name: file.name,
                        status: 'error',
                        error: { message: FileTooBigErrorMessage },
                        originFileObj: file,
                        type: file.type,
                        size: file.size,
                    }
                    setFileList(prev => [...prev, errored])
                } else {
                    set(file, 'status', 'error')
                    set(file, ['error', 'message'], FileTooBigErrorMessage)
                    setFileList(prev => [...prev, file])
                }
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
        },
        fileList,
        multiple: true,
    }

    console.log({
        fileList,
    })

    return (
        <>
            <SaveDocumentsModal fileList={fileList} setFileList={setFileList} />
            <Upload
                key='ai-chat-attachment-upload-trigger'
                multiple
                // showUploadList={false}
                // accept={attachments.extensions}
                fileList={uploadProps.fileList}
                beforeUpload={uploadProps.beforeUpload}
                // customRequest={attachments.handleUploadRequest}
                // onChange={attachments.handleUploadFileListChange}
                // disabled={attachmentsUploadDisabled}
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
            </Upload>
        </>
    )
}

const MAX_FILE_SIZE_IN_MB = MAX_UPLOAD_FILE_SIZE / (1024 * 1024)

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
    const MaxFileSizeMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.files.maxSizeMessage' }, {
        maxFileSizeInMb: MAX_FILE_SIZE_IN_MB,
    })
    const FileTooBigErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.FileTooBig' }, {
        maxSizeInMb: MAX_FILE_SIZE_IN_MB,
    })

    console.log({
        attachments,
    })

    return (
        <>
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
                                <UploadFiles
                                    key='ai-chat-attachment-upload-trigger'
                                    attachments={attachments}
                                    canExecuteAIFlow={canExecuteAIFlow}
                                />,
                                <Button
                                    key='ai-chat-attachment-upload-trigger-2'
                                    type='secondary'
                                    size='medium'
                                    minimal
                                    compact
                                    disabled={attachmentsUploadDisabled}
                                    icon={<Paperclip size='small' color='red' />}
                                />,
                            ] : []}
                        />
                    </div>
                </Space>
            </div>
        </>

    )
}
