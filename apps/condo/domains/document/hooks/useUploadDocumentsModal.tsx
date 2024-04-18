import { Col, Form, Row, Space, Upload, UploadFile, UploadProps } from 'antd'
import { RcFile } from 'antd/es/upload'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import pick from 'lodash/pick'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import React, { useCallback, useMemo, useState } from 'react'

import { ArrowLeft, Paperclip } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Modal, Select, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { Document, DocumentCategory } from '@condo/domains/document/utils/clientSchema'

import { TrackingEventType } from '../../common/components/TrackingContext'
import { MAX_UPLOAD_FILE_SIZE } from '../../common/constants/uploads'
import { DocumentCategoryFormItem } from '../components/DocumentCategoryFormItem'


const UploadDocumentsModal = ({ open, setOpen, onComplete, initialCreateDocumentValue = {} }) => {
    const intl = useIntl()
    const SaveMessage = intl.formatMessage({ id: 'Save' })

    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [formSubmitting, setFormSubmitting] = useState<boolean>(false)
    const [uploadForm] = Form.useForm()

    const createDocuments = Document.useCreateMany({})

    const loading = formSubmitting

    const uploadFormAction = useCallback(async values => {
        setFormSubmitting(true)

        const category = get(values, 'category')
        if (!category) {
            setFormSubmitting(false)
            setOpen(null)

            return
        }

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
                title='Добавление документов'
                footer={(
                    <Space size={16} direction='horizontal'>
                        <Form.Item shouldUpdate>
                            {
                                ({ getFieldsError }) => {
                                    // const errors = getFieldsError(['file'])
                                    //     .flatMap(obj => obj.errors)

                                    return (
                                        <Button
                                            type='primary'
                                            onClick={() => uploadForm.submit()}
                                            // disabled={!isEmpty(errors) || isEmpty(fileList)}
                                            loading={loading}
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
                        Выберите категорию файлов для загрузки, чтобы быстро находить документы в списке
                    </Typography.Text>
                    <DocumentCategoryFormItem />
                    <Upload {...uploadProps}>
                        <Button type='secondary' icon={<Paperclip size='medium' />}>
                            Прикрепить файл
                        </Button>
                    </Upload>
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