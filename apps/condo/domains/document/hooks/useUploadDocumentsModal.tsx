import { Form, UploadFile, UploadProps } from 'antd'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import set from 'lodash/set'
import { useCallback, useMemo, useState } from 'react'

import { Paperclip } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography, Space } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { StyledUpload } from '@condo/domains/common/components/MultipleFileUpload'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'
import { DocumentCategoryFormItem } from '@condo/domains/document/components/DocumentCategoryFormItem'
import { Document } from '@condo/domains/document/utils/clientSchema'


const MAX_FILE_SIZE_IN_MB = MAX_UPLOAD_FILE_SIZE / (1024 * 1024)

const UploadDocumentsModal = ({ openUploadModal, setOpenUploadModal, onComplete, initialCreateDocumentValue = {} }) => {
    const intl = useIntl()
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
        setOpenUploadModal(null)
    }, [closeCancelModal, setOpenUploadModal])

    const uploadFormAction = useCallback(async values => {
        setFormSubmitting(true)

        const category = get(values, 'category')
        const canReadByResident = get(values, 'canReadByResident')
        const filesChunks = chunk(filesWithoutError, 5)

        for (const filesChunk of filesChunks) {
            await createDocuments(
                filesChunk.map((file) => {
                    return {
                        ...initialCreateDocumentValue,
                        file,
                        category: { connect: { id: category } },
                        canReadByResident,
                    }
                })
            )
        }

        setFormSubmitting(false)
        closeModal()

        if (isFunction(onComplete)) {
            await onComplete()
        }
    }, [createDocuments, filesWithoutError, initialCreateDocumentValue, onComplete, closeModal])

    const uploadProps: UploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file)
            const newFileList = fileList.slice()
            newFileList.splice(index, 1)
            setFileList(newFileList)
        },
        beforeUpload: (file) => {
            if (file.size > MAX_UPLOAD_FILE_SIZE) {
                set(file, 'status', 'error')
                set(file, ['error', 'message'], FileTooBigErrorMessage)
            }

            setFileList((prevState) => [...prevState, file])
            return
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

    const UploadModal = (props) => (
        <UploadDocumentsModal
            {...props}
            openUploadModal={openUploadModal}
            setOpenUploadModal={setOpenUploadModal}
        />
    )

    return { setOpen: setOpenUploadModal, UploadDocumentsModal: UploadModal }
}