import { Form, UploadFile, UploadProps } from 'antd'
import chunk from 'lodash/chunk'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import set from 'lodash/set'
import getConfig from 'next/config'
import { useCallback, useMemo, useState } from 'react'

import { buildMeta, upload as uploadFiles } from '@open-condo/files'
import { Paperclip } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography, Space } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { StyledUpload } from '@condo/domains/common/components/MultipleFileUpload'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'
import { DocumentCategoryFormItem } from '@condo/domains/document/components/DocumentCategoryFormItem'
import { Document } from '@condo/domains/document/utils/clientSchema'

import type { RcFile } from 'antd/es/upload/interface'

type UploadDocumentsModalProps = {
    openUploadModal: boolean
    setOpenUploadModal: (open: boolean) => void
    onComplete: () => void
    initialCreateDocumentValue?: {
        organization?: { connect: { id: string } }
        property?: { connect: { id: string } }
    }
}

const { publicRuntimeConfig: { fileClientId } } = getConfig()
const FILE_UPLOAD_MODEL = 'Document'
const MAX_FILE_SIZE_IN_MB = MAX_UPLOAD_FILE_SIZE / (1024 * 1024)

const UploadDocumentsModal = ({ 
    openUploadModal, 
    setOpenUploadModal, 
    onComplete, 
    initialCreateDocumentValue = {}, 
}: UploadDocumentsModalProps) => {
    const intl = useIntl()
    const { user } = useAuth()
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const ModalTitle = intl.formatMessage({ id: 'documents.uploadDocumentsModal.title' })
    const CategoryMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.category.message' })
    const AttachFilesMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.files.attachMessage' })
    const MaxFileSizeMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.files.maxSizeMessage' }, {
        maxFileSizeInMb: MAX_FILE_SIZE_IN_MB,
    })
    const FileTooBigErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.FileTooBig' }, {
        maxSizeInMb: MAX_FILE_SIZE_IN_MB,
    })
    const CancelButtonMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.cancelButton' })
    const CancelModalTitle = intl.formatMessage({ id: 'documents.uploadDocumentsModal.cancel.title' })
    const CancelModalMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.cancel.message' })
    const DontSaveMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.cancel.dontSave' })

    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false)
    const [uploadForm] = Form.useForm()

    const category = Form.useWatch('category', uploadForm)
    const filesWithoutError = useMemo(() => fileList.filter(file => file.status !== 'error'), [fileList])

    const createDocuments = Document.useCreateMany({})

    const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)
    const closeCancelModal = useCallback(() => setIsCancelModalOpen(false), [])
    const openCancelModal = useCallback(() => {
        if (isEmpty(category) && isEmpty(fileList)) {
            return setOpenUploadModal(false)
        }

        setIsCancelModalOpen(true)
    }, [category, fileList, setOpenUploadModal])

    const closeModal = useCallback(() => {
        closeCancelModal()
        setOpenUploadModal(false)
    }, [closeCancelModal, setOpenUploadModal])

    const uploadFormAction = useCallback(async values => {
        const selectedFiles = filesWithoutError
        if (!selectedFiles.length) return

        setFormSubmitting(true)

        const categoryId = values?.category
        const canReadByResident = Boolean(values?.canReadByResident)
        const senderInfo = getClientSideSenderInfo()
        const organizationId = initialCreateDocumentValue?.organization?.connect?.id

        const baseCreateData = {
            dv: 1,
            sender: senderInfo,
            ...initialCreateDocumentValue,
            ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
            canReadByResident,
        }

        try {
            const filesChunks = chunk(selectedFiles, 5)
            for (const filesChunk of filesChunks) {
                setFileList(prevFiles => prevFiles.map(file => {
                    if (filesChunk.some(chunkFile => chunkFile.uid === file.uid)) {
                        return { ...file, status: 'uploading' }
                    }
                    return file
                }))

                let createInput

                if (fileClientId) {
                    const rcFiles = filesChunk
                        .map((file) => file.originFileObj)
                        .filter((originFile): originFile is RcFile => !!originFile)

                    const filesToUpload = rcFiles.map((file) => file as File)

                    const uploadResult = await uploadFiles({
                        files: filesToUpload,
                        meta: buildMeta({
                            userId: user.id,
                            fileClientId: fileClientId,
                            modelNames: [FILE_UPLOAD_MODEL],
                            fingerprint: senderInfo.fingerprint,
                            organizationId,
                        }),
                    })

                    createInput = uploadResult.files.map((uploadedFile, index) => ({
                        ...baseCreateData,
                        name: filesChunk[index].name,
                        file: {
                            signature: uploadedFile.signature,
                        },
                    }))
                } else {
                    createInput = filesChunk.map(file => ({
                        ...baseCreateData,
                        file,
                    }))
                }

                await createDocuments(createInput)

                setFileList(prevFiles => prevFiles.map(file => {
                    if (filesChunk.some(chunkFile => chunkFile.uid === file.uid)) {
                        return { ...file, status: 'done' }
                    }
                    return file
                }))
            }

            setFileList([])
            uploadForm.resetFields()
            closeModal()

            if (isFunction(onComplete)) {
                await onComplete()
            }
        } catch (error) {
            console.error(error)
            setFileList(prevFiles => prevFiles.map(file => {
                if (selectedFiles.some(selectedFile => selectedFile.uid === file.uid)) {
                    return { ...file, status: 'error' }
                }
                return file
            }))
        } finally {
            setFormSubmitting(false)
        }
    }, [
        filesWithoutError,
        initialCreateDocumentValue,
        createDocuments,
        uploadForm,
        closeModal,
        onComplete,
        user?.id,
    ])

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

            return false
        },
        fileList,
        multiple: true,
    }

    return (
        <>
            <FormWithAction
                action={uploadFormAction}
                layout='vertical'
                validateTrigger={['onBlur', 'onSubmit']}
                formInstance={uploadForm}
            >
                <Modal
                    open={openUploadModal}
                    onCancel={openCancelModal}
                    title={ModalTitle}
                    footer={(
                        <Space size={16} direction='horizontal'>
                            <Button type='secondary' onClick={openCancelModal}>
                                {CancelButtonMessage}
                            </Button>
                            <Form.Item shouldUpdate>
                                {
                                    ({ getFieldValue }) => {
                                        const category = getFieldValue('category')

                                        return (
                                            <Button
                                                type='primary'
                                                onClick={() => uploadForm.submit()}
                                                disabled={!category || isEmpty(filesWithoutError)}
                                                loading={formSubmitting}
                                            >
                                                {SaveMessage}
                                            </Button>
                                        )
                                    }
                                }
                            </Form.Item>
                        </Space>
                    )}
                >
                    <Space size={24} direction='vertical'>
                        <Typography.Text size='large' type='secondary'>
                            {CategoryMessage}
                        </Typography.Text>
                        <DocumentCategoryFormItem />
                        <Space size={8} direction='vertical'>
                            <Typography.Text type='secondary' size='medium'>
                                {MaxFileSizeMessage}
                            </Typography.Text>
                            <StyledUpload reverseFileList {...uploadProps}>
                                <Button type='secondary' icon={<Paperclip size='medium' />}>
                                    {AttachFilesMessage}
                                </Button>
                            </StyledUpload>
                        </Space>
                    </Space>
                </Modal>
            </FormWithAction>
            <Modal
                open={isCancelModalOpen}
                title={CancelModalTitle}
                footer={(
                    <Space size={16} direction='horizontal'>
                        <Button type='secondary' danger onClick={closeModal}>
                            {DontSaveMessage}
                        </Button>
                        <Button type='secondary' onClick={closeCancelModal}>
                            {SaveMessage}
                        </Button>
                    </Space>
                )}
                onCancel={closeCancelModal}
            >
                <Typography.Text type='secondary'>
                    {CancelModalMessage}
                </Typography.Text>
            </Modal>
        </>
    )
}

export const useUploadDocumentsModal = () => {
    const [openUploadModal, setOpenUploadModal] = useState<boolean>(false)

    const UploadModal = (props: Pick<UploadDocumentsModalProps, 'onComplete' | 'initialCreateDocumentValue'>) => (
        <UploadDocumentsModal
            {...props}
            openUploadModal={openUploadModal}
            setOpenUploadModal={setOpenUploadModal}
        />
    )

    return { setOpen: setOpenUploadModal, UploadDocumentsModal: UploadModal }
}
