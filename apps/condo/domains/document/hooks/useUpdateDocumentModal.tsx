import { Document as DocumentType } from '@app/condo/schema'
import { Form, notification, Space, Upload } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useMemo, useState } from 'react'

import { Download, Paperclip } from '@open-condo/icons'
import { Button, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { DocumentCategoryFormItem } from '@condo/domains/document/components/DocumentCategoryFormItem'
import { Document } from '@condo/domains/document/utils/clientSchema'


const UpdateDocumentModal = ({ selectedDocument, setSelectedDocument, refetchDocuments }) => {
    const updateAction = Document.useUpdate({})
    const softDeleteAction = Document.useSoftDelete()

    const [updateForm] = Form.useForm()

    const { downloadFile } = useDownloadFileFromServer()

    const [loading, setLoading] = useState<boolean>(false)
    const [modalState, setModalState] = useState<'update' | 'confirmDelete'>('update')

    const openConfirmDeleteModal = useCallback(() => setModalState('confirmDelete'), [])
    const closeModal = useCallback(() => {
        setSelectedDocument(null)
        setModalState(null)
    }, [setSelectedDocument])

    const softDeleteDocument = useCallback(async () => {
        await softDeleteAction(selectedDocument)
        await refetchDocuments()
        closeModal()

        notification.success({ message: 'Готово' })
    }, [closeModal, refetchDocuments, selectedDocument, softDeleteAction])

    const handleDownload = useCallback(async () => {
        const url = get(selectedDocument, 'file.publicUrl')
        const name = get(selectedDocument, 'file.originalFilename')

        await downloadFile({ url, name })
    }, [downloadFile, selectedDocument])

    const updateDocumentAction = useCallback(async (values) => {
        setLoading(true)

        await updateAction({
            category: { connect: { id: values.category } },
        }, selectedDocument)

        await refetchDocuments()
        closeModal()
        setLoading(false)
    }, [closeModal, refetchDocuments, selectedDocument, updateAction])

    const fileName = get(selectedDocument, 'name')

    return (
        <>
            <FormWithAction
                action={updateDocumentAction}
                layout='vertical'
                validateTrigger={['onBlur', 'onSubmit']}
                formInstance={updateForm}
            >
                <Modal
                    width='small'
                    open={modalState === 'update'}
                    onCancel={closeModal}
                    title={fileName}
                    footer={(
                        <Space size={16} direction='horizontal'>
                            <Button type='secondary' danger onClick={openConfirmDeleteModal}>
                                Удалить
                            </Button>
                            <Button
                                type='secondary'
                                icon={<Download size='medium' />}
                                onClick={handleDownload}
                            >
                                Скачать файл
                            </Button>
                            <Form.Item shouldUpdate>
                                {
                                    ({ getFieldsError }) => {
                                        // const errors = getFieldsError(['file'])
                                        //     .flatMap(obj => obj.errors)

                                        return (
                                            <Button
                                                type='primary'
                                                onClick={() => updateForm.submit()}
                                                // disabled={!isEmpty(errors) || isEmpty(fileList)}
                                                loading={loading}
                                            >
                                                Сохранить
                                            </Button>
                                        )
                                    }
                                }
                            </Form.Item>
                        </Space>
                    )}
                >
                    <Space size={24} direction='vertical'>
                        <div style={{ width: '100%', backgroundColor: colors.gray[1], borderRadius: '8px', padding: '16px' }}>
                            <Space size={24} direction='horizontal' align='center'>
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                                    <Paperclip size='small' color={colors.gray[7]} />
                                    <Typography.Text size='medium'>{fileName}</Typography.Text>
                                </div>
                                <Typography.Text type='secondary'>
                                    {dayjs(get(selectedDocument, 'createdAt')).format('YYYY.MM.DD')}
                                </Typography.Text>
                            </Space>
                        </div>
                        <DocumentCategoryFormItem
                            initialValue={get(selectedDocument, 'category.id')}
                        />
                    </Space>
                </Modal>
            </FormWithAction>
            <Modal
                open={modalState === 'confirmDelete'}
                onCancel={closeModal}
                title='Удалить файл'
                footer={[
                    <Button key='delete' type='secondary' danger onClick={softDeleteDocument}>
                        Удалить
                    </Button>,
                    <Button key='cancel' type='secondary' onClick={() => setModalState('update')}>
                        Оставить
                    </Button>,
                ]}
            >
                <Typography.Text type='secondary' size='large'>
                    Восстановить файл будет нельзя. Но можно загрузить его заново.
                </Typography.Text>
            </Modal>
        </>
    )
}

export const useUpdateDocumentModal = () => {
    const [selectedDocument, setSelectedDocument] = useState<DocumentType>()

    const UpdateModal = useCallback((props) => selectedDocument ? (
        <UpdateDocumentModal
            {...props}
            selectedDocument={selectedDocument}
            setSelectedDocument={setSelectedDocument}
        />
    ) : null, [selectedDocument])

    return { setSelectedDocument, UpdateDocumentModal: UpdateModal }
}