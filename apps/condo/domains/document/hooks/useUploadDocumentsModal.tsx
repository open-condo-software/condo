import { Form, Space, UploadFile, UploadProps } from 'antd'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useState } from 'react'

import { Paperclip } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { StyledUpload } from '@condo/domains/common/components/MultipleFileUpload'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'
import { DocumentCategoryFormItem } from '@condo/domains/document/components/DocumentCategoryFormItem'
import { Document } from '@condo/domains/document/utils/clientSchema'


const UploadDocumentsModal = ({ open, setOpen, onComplete, initialCreateDocumentValue = {} }) => {
    const intl = useIntl()
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const ModalTitle = intl.formatMessage({ id: 'documents.uploadDocumentsModal.title' })
    const CategoryMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.category.message' })
    const AttachFilesMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.files.attachMessage' })
    const MaxFileSizeMessage = intl.formatMessage({ id: 'documents.uploadDocumentsModal.files.maxSizeMessage' }, {
        maxFileSizeInMb: MAX_UPLOAD_FILE_SIZE / (1024 * 1024),
    })

    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false)
    const [uploadForm] = Form.useForm()

    const createDocuments = Document.useCreateMany({})

    const uploadFormAction = useCallback(async values => {
        setFormSubmitting(true)

        const category = get(values, 'category')
        const filesChunks = chunk(fileList, 5)

        for (const filesChunk of filesChunks) {
            await createDocuments(
                filesChunk.map((file) => {
                    return {
                        ...initialCreateDocumentValue,
                        file,
                        category: { connect: { id: category } },
                    }
                })
            )
        }

        setFormSubmitting(false)
        setOpen(null)

        if (isFunction(onComplete)) {
            await onComplete()
        }
    }, [createDocuments, fileList, initialCreateDocumentValue, onComplete, setOpen])

    const uploadProps: UploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file)
            const newFileList = fileList.slice()
            newFileList.splice(index, 1)
            setFileList(newFileList)
        },
        beforeUpload: (file) => {
            setFileList((prevState) => [...prevState, file])
            return false
        },
        fileList,
        multiple: true,
    }

    return (
        <FormWithAction
            action={uploadFormAction}
            layout='vertical'
            validateTrigger={['onBlur', 'onSubmit']}
            formInstance={uploadForm}
        >
            <Modal
                open={open}
                onCancel={() => setOpen(null)}
                title={ModalTitle}
                footer={(
                    <Space size={16} direction='horizontal'>
                        <Form.Item shouldUpdate>
                            {
                                ({ getFieldValue }) => {
                                    const category = getFieldValue('category')

                                    return (
                                        <Button
                                            type='primary'
                                            onClick={() => uploadForm.submit()}
                                            disabled={!category || isEmpty(fileList)}
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
    )
}

export const useUploadDocumentsModal = () => {
    const [isUploadDocumentsOpen, setIsUploadDocumentsOpen] = useState<boolean>(false)

    const UploadModal = (props) => (
        <UploadDocumentsModal
            {...props}
            open={isUploadDocumentsOpen}
            setOpen={setIsUploadDocumentsOpen}
        />
    )

    return { setOpen: setIsUploadDocumentsOpen, UploadDocumentsModal: UploadModal }
}