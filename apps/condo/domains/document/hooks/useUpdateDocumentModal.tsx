import { Document as DocumentType } from '@app/condo/schema'
import { Col, Form, notification, Row, Space } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { Download, Paperclip } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { DocumentCategoryFormItem } from '@condo/domains/document/components/DocumentCategoryFormItem'
import { Document } from '@condo/domains/document/utils/clientSchema'


const FILE_WRAPPER_STYLE: CSSProperties = { width: '100%', backgroundColor: colors.gray[1], borderRadius: '8px', padding: '16px' }
const FILE_NAME_WRAPPER_STYLE: CSSProperties = { display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }

const UpdateDocumentModal = ({ selectedDocument, setSelectedDocument, refetchDocuments }) => {
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
        setLoading(true)

        await softDeleteAction(selectedDocument)
        await refetchDocuments()

        setLoading(false)
        closeModal()

        notification.success({ message: ReadyMessage })
    }, [ReadyMessage, closeModal, refetchDocuments, selectedDocument, softDeleteAction])

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

    const fileName = useMemo(() => get(selectedDocument, 'name'), [selectedDocument])

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
                                {DeleteMessage}
                            </Button>
                            <Button
                                type='secondary'
                                icon={<Download size='medium' />}
                                onClick={handleDownload}
                            >
                                {DownloadFileMessage}
                            </Button>
                            <Form.Item shouldUpdate>
                                {
                                    ({ getFieldValue }) => {
                                        const categoryFromField = getFieldValue('category')
                                        const canReadByResidentField = getFieldValue('canReadByResident')

                                        return (
                                            <Button
                                                type='primary'
                                                onClick={() => updateForm.submit()}
                                                disabled={
                                                    get(selectedDocument, 'category.id') === categoryFromField &&
                                                    get(selectedDocument, 'canReadByResident')  === canReadByResidentField
                                                }
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
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <div style={FILE_WRAPPER_STYLE}>
                                <Space size={24} direction='horizontal' align='center'>
                                    <div style={FILE_NAME_WRAPPER_STYLE}>
                                        <Paperclip size='small' color={colors.gray[7]} />
                                        <Typography.Text size='medium'>{fileName}</Typography.Text>
                                    </div>
                                    <Typography.Text type='secondary' size='small'>
                                        {dayjs(get(selectedDocument, 'createdAt')).format('DD.MM.YYYY')}
                                    </Typography.Text>
                                </Space>
                            </div>
                        </Col>
                        <Col span={24}>
                            <DocumentCategoryFormItem
                                initialValue={get(selectedDocument, 'category.id')}
                            />
                        </Col>
                    </Row>
                </Modal>
            </FormWithAction>
            <Modal
                open={modalState === 'confirmDelete'}
                onCancel={closeModal}
                title={CancelModalTitle}
                footer={[
                    <Button key='delete' type='secondary' danger onClick={softDeleteDocument}>
                        {DeleteMessage}
                    </Button>,
                    <Button key='cancel' type='secondary' onClick={() => setModalState('update')}>
                        {CancelUpdateMessage}
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