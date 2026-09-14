import { Row, Col, Form } from 'antd'
import chunk from 'lodash/chunk'
import getConfig from 'next/config'
import React, { CSSProperties, useCallback, useMemo, useState, useEffect } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { buildMeta, upload as uploadFiles } from '@open-condo/files'
import { QuestionCircle } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Tooltip, Modal, Typography, Switch } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { AIChatDocument } from '@condo/domains/ai/components/AIChatFile'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { Document } from '@condo/domains/document/utils/clientSchema'

import { DocumentsEditableTable } from './DocumentsEditableTable'
import styles from './SaveDocumentModal.module.css'

import type { RcFile } from 'antd/es/upload/interface'


const { publicRuntimeConfig: { fileClientId } } = getConfig()


const FILE_WRAPPER_STYLE: CSSProperties = { width: '100%', backgroundColor: colors.gray[1], borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }


const SaveDocumentsModal: React.FC<any> = ({ setModalState, modalState, fileList, setFileList, onUploadComplete }) => {
    const intl = useIntl()
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const CancelModalTitle = intl.formatMessage({ id: 'documents.updateDocumentModal.cancel.title' })
    const CancelModalMessage = intl.formatMessage({ id: 'documents.updateDocumentModal.cancel.message' })

    const { user } = useAuth()
    const { organization, role } = useOrganization()
    const organizationId = organization?.id || null
    const canCreateDocuments = role?.canManageDocuments || false

    const createDocuments = Document.useCreateMany({})

    const [loading, setLoading] = useState<boolean>(false)
    const [isSaveFiles, setIsSaveFiles] = useState<boolean>(false)

    const [uploadForm] = Form.useForm()
    const files = Form.useWatch('files', uploadForm) || []
    const validFiles = files.filter(file => {
        const isValidOrganizationDocument = file.documentType === 'organization'
            && file.propertyId === null
            && file.categoryId === null
        const isValidPropertyDocument = file.documentType === 'property'
            && !!file.propertyId && typeof file.propertyId === 'string'
            && !!file.categoryId && typeof file.categoryId === 'string'
        return isValidOrganizationDocument || isValidPropertyDocument
    })
    const isDisabledButtonSave = isSaveFiles ? (!validFiles.length || files.length !== validFiles.length) : !files.length

    // [{
    //      fileName: <string>,
    //      uid: <string>,
    //      id: <uid>,
    //      type: <string>,
    //      size: <number>,
    //      originFileObj: {},
    //      documentType: 'organization' | 'property',
    //      propertyId: <string>,
    //      categoryId: <string>
    // }]
    const fileListToForm = useCallback((fileList: Array<any>) => {
        return fileList.map(fileItem => ({
            ...fileItem,
            documentType: 'organization',
            propertyId: null,
            categoryId: null,
        }))
    }, [])

    const filesWithoutErrors = useMemo(() => fileList.filter(file => file.status !== 'error'), [fileList])

    useDeepCompareEffect(() => {
        uploadForm.setFieldValue('files', fileListToForm(filesWithoutErrors))
    }, [filesWithoutErrors])

    console.log({
        uploadForm: uploadForm.getFieldsValue(),
        fileList,
        filesWithoutErrors,
    })

    useEffect(() => {
        uploadForm.setFieldValue('isSaveFiles', isSaveFiles)
    }, [isSaveFiles])

    const openConfirmCancelModal = useCallback(() => setModalState('confirmCancel'), [])
    const closeModal = useCallback(() => {
        setModalState(null)
        setIsSaveFiles(false)
        uploadForm.resetFields()
        setFileList([])
    }, [setModalState, setFileList, uploadForm])

    const saveDocumentsAction = useCallback(async (values) => {
        if (loading) return
        if (isDisabledButtonSave) return

        const { isSaveFiles, files } = values

        if (!Array.isArray(files) || !files.length) return

        setLoading(true)

        console.log('saveDocumentsAction', {
            values,
        })

        const senderInfo = getClientSideSenderInfo()

        const baseCreateData = {
            dv: 1,
            sender: senderInfo,
            organization: { connect: { id: organizationId } },
        }

        const filesChunks = chunk(files, 2)
        for (const filesChunk of filesChunks) {

            const filesToUpload = filesChunk
                .map((file) => file.originFileObj)
                .filter((originFile): originFile is RcFile => !!originFile)

            console.log({
                filesToUpload,
            })

            if (isSaveFiles) {
                let createInput

                if (fileClientId) {
                    const uploadResult = await uploadFiles({
                        files: filesToUpload,
                        meta: buildMeta({
                            userId: user.id,
                            fileClientId: fileClientId,
                            modelNames: ['Document'],
                            fingerprint: senderInfo.fingerprint,
                            organizationId,
                        }),
                    })

                    console.log({
                        uploadResult,
                        filesToUpload,
                    })

                    createInput = uploadResult.files.map((uploadedFile, index) => ({
                        ...baseCreateData,
                        ...(filesChunk[index]?.categoryId ? { category: { connect: { id: filesChunk[index].categoryId } } } : {}),
                        ...(filesChunk[index]?.propertyId ? { property: { connect: { id: filesChunk[index].propertyId } } } : {}),
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

                const res = await createDocuments(createInput)

                console.log({
                    res,
                })

                if (onUploadComplete) {
                    onUploadComplete(res.map((document, index) => ({
                        ...document,
                        file: {
                            ...document.file,
                            size: filesToUpload[index].size,
                            mimetype: filesToUpload[index].type,
                        },
                        size: filesToUpload[index].size,
                        mimetype: filesToUpload[index].type,
                    })))
                }
            } else {
                const uploadResult = await uploadFiles({
                    files: filesToUpload,
                    meta: buildMeta({
                        userId: user.id,
                        fileClientId: fileClientId,
                        modelNames: ['Document'],
                        fingerprint: senderInfo.fingerprint,
                        organizationId,
                    }),
                })

                if (onUploadComplete) {
                    onUploadComplete(uploadResult.files.map((file, index) => ({
                        name: filesChunk[index].name,
                        ...file,
                        size: filesToUpload[index].size,
                        mimetype: filesToUpload[index].type,
                    })))
                }
            }
        }

        closeModal()
        setLoading(false)
    }, [closeModal, createDocuments, isDisabledButtonSave, loading, onUploadComplete, organizationId, user?.id])

    return (
        <>
            <FormWithAction
                action={saveDocumentsAction}
                layout='vertical'
                validateTrigger={['onBlur', 'onSubmit']}
                formInstance={uploadForm}
            >
                <Modal
                    scrollX={false}
                    width='big'
                    open={modalState === 'uploadParameters'}
                    onCancel={openConfirmCancelModal}
                    title='Параметры загрузки'
                    footer={(
                        <Space size={16} direction='horizontal' wrap>
                            <Button
                                type='primary'
                                onClick={() => uploadForm.submit()}
                                disabled={isDisabledButtonSave}
                            >
                                {isSaveFiles ? 'Сохранить и загрузить' : SaveMessage}
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
                                    disabled={!canCreateDocuments}
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
                                        <DocumentsEditableTable documents={filesWithoutErrors} form={uploadForm} />
                                    )
                                    : (
                                        <div className={styles.attachmentContainer}>
                                            {filesWithoutErrors.map((file) => (
                                                <AIChatDocument
                                                    key={file.uid}
                                                    name={file.name}
                                                />
                                            ))}
                                        </div>
                                    )
                            }
                        </Col>
                    </Row>
                </Modal>
                <Form.Item hidden name='files' shouldUpdate={true} />
                <Form.Item hidden name='isSaveFiles' shouldUpdate={true} initialValue={false} />
            </FormWithAction>
            <Modal
                open={modalState === 'confirmCancel'}
                onCancel={() => setModalState('uploadParameters')}
                title={CancelModalTitle}
                footer={[
                    <Button key='delete' type='secondary' danger onClick={closeModal}>
                        Не сохранять
                    </Button>,
                    <Button key='cancel' type='secondary' onClick={() => setModalState('uploadParameters')}>
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


export const useSelectFromSavedDocumentsModal = () => {
    const [modalState, setModalState] = useState<'uploadParameters' | 'confirmCancel'>(null)

    const SaveModal = useCallback((props) => (
        <SaveDocumentsModal modalState={modalState} setModalState={setModalState} {...props} />
    ), [modalState, setModalState])

    const setOpen = useCallback(() => {
        setModalState('uploadParameters')
    }, [])

    return {
        openSaveDocumentsModal: setOpen, SaveDocumentsModal: SaveModal,
    }
}