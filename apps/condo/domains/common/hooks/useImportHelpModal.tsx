import styled from '@emotion/styled'
import { Col, Form, Row, Space } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import getConfig from 'next/config'
import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'

import { ArrowLeft, Phone } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Card, Modal, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { UserHelpRequest, UserHelpRequestFile } from '@condo/domains/onboarding/utils/clientSchema'

import { useValidations } from './useValidations'


const { publicRuntimeConfig: { importInstructionUrl } } = getConfig()

const CardsWrapper = styled.div<{ hasInstructionCard: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 8px;

  & .condo-card {
    width: ${props => props.hasInstructionCard ? '240px' : 'auto'};
    display: flex;
    flex-direction: column;

    .condo-card-body {
      flex-grow: 1;
    }
  }
`
const UserHelpModal = styled(Modal)`
  &.condo-modal .condo-modal-header {
    padding: 40px 40px 8px 40px;
  }
  
  &.condo-modal .condo-modal-body {
    padding-top: 0;
  }
`

const CallBackModal = ({ domainName, activeModal, setActiveModal }) => {
    const intl = useIntl()
    const ModalTitle = intl.formatMessage({ id: 'import.callbackModal.title' })
    const BackMessage = intl.formatMessage({ id: 'Back' })
    const SubmitButtonLabel = intl.formatMessage({ id: 'import.callbackModal.submitButtonLabel' })
    const ModalBodyText = intl.formatMessage({ id: 'import.callbackModal.body' })
    const PhoneLabel = intl.formatMessage({ id: 'import.callbackModal.phoneLabel' })

    const { user } = useAuth()
    const { organization } = useOrganization()
    const phone = useMemo(() => get(user, 'phone'), [user])
    const initialValues = useMemo(() => ({ phone }), [phone])
    const createHelpRequestAction = UserHelpRequest.useCreate({
        organization: { connect: { id: get(organization, 'id', null) } },
        meta: { importType: domainName },
    })

    const [callForm] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(false)

    const callFormAction = useCallback(async values => {
        setLoading(true)
        await createHelpRequestAction({
            type: 'callback',
            phone: get(values, 'phone'),
        })

        setActiveModal(null)
        setLoading(false)
    }, [createHelpRequestAction, setActiveModal])

    const { requiredValidator, phoneValidator } = useValidations()

    return (
        <FormWithAction
            action={callFormAction}
            initialValues={initialValues}
            layout='vertical'
            validateTrigger={['onBlur', 'onSubmit']}
            formInstance={callForm}
        >
            <UserHelpModal
                open={activeModal === 'call'}
                onCancel={() => setActiveModal(null)}
                title={ModalTitle}
                footer={(
                    <Space size={16} direction='horizontal'>
                        <LinkWithIcon
                            title={BackMessage}
                            size='large'
                            onClick={() => setActiveModal('choose')}
                            PrefixIcon={ArrowLeft}
                        />
                        <Form.Item shouldUpdate>
                            {
                                ({ getFieldError }) => {
                                    const errors = getFieldError('phone')

                                    return (
                                        <Button
                                            type='primary'
                                            onClick={() => callForm.submit()}
                                            disabled={!isEmpty(errors)}
                                            loading={loading}
                                        >
                                            {SubmitButtonLabel}
                                        </Button>
                                    )
                                }
                            }
                        </Form.Item>
                    </Space>
                )}
            >
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Typography.Text size='medium' type='secondary'>
                            {ModalBodyText}
                        </Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='phone'
                            label={PhoneLabel}
                            required
                            rules={[phoneValidator, requiredValidator]}
                            colon={false}
                            labelCol={{ span: 24 }}
                        >
                            <PhoneInput block/>
                        </Form.Item>
                    </Col>
                </Row>
            </UserHelpModal>
        </FormWithAction>
    )
}

const FileImportModal = ({ domainName, activeModal, setActiveModal }) => {
    const intl = useIntl()
    const ModalTitle = intl.formatMessage({ id: 'import.fileImportHelpModal.title' })
    const BackMessage = intl.formatMessage({ id: 'Back' })
    const SubmitButtonLabel = intl.formatMessage({ id: 'import.fileImportHelpModal.submitButtonLabel' })
    const ModalBodyText = intl.formatMessage({ id: 'import.fileImportHelpModal.body' })
    const AlertMessage = intl.formatMessage({ id: 'import.fileImportHelpModal.alert.message' })
    const AlertDescription = intl.formatMessage({ id: 'import.fileImportHelpModal.alert.description' })
    const PhoneCheckMessage = intl.formatMessage({ id: 'import.fileImportHelpModal.phoneCheck' })
    const PhoneLabel = intl.formatMessage({ id: 'import.fileImportHelpModal.phoneLabel' })

    const { user } = useAuth()
    const { organization } = useOrganization()
    const phone = useMemo(() => get(user, 'phone'), [user])
    const initialValues = useMemo(() => ({ phone }), [phone])
    const createHelpRequestAction = UserHelpRequest.useCreate({
        organization: { connect: { id: get(organization, 'id', null) } },
        meta: { importType: domainName },
    })
    const updateHelpRequestAction = UserHelpRequest.useUpdate({})
    const { requiredValidator, phoneValidator } = useValidations()

    const [loading, setLoading] = useState<boolean>(false)
    const [filesUploading, setFilesUploading] = useState<boolean>(false)
    const [files, setFiles] = useState([])
    const [uploadForm] = Form.useForm()

    const { UploadComponent, syncModifiedFiles } = useMultipleFileUploadHook({
        Model: UserHelpRequestFile,
        relationField: 'userHelpRequest',
        initialFileList: [],
    })

    const uploadFormAction = useCallback(async values => {
        setLoading(true)
        const helpRequest = await createHelpRequestAction({
            type: 'importFile',
            phone: get(values, 'phone'),
            isReadyToSend: false,
        })

        await syncModifiedFiles(helpRequest.id)

        await updateHelpRequestAction({
            isReadyToSend: true,
        }, helpRequest)

        setLoading(false)
        setActiveModal(null)
    }, [createHelpRequestAction, setActiveModal, syncModifiedFiles, updateHelpRequestAction])

    return (
        <FormWithAction
            action={uploadFormAction}
            initialValues={initialValues}
            layout='vertical'
            validateTrigger={['onBlur', 'onSubmit']}
            formInstance={uploadForm}
        >
            <Modal
                open={activeModal === 'upload'}
                onCancel={() => setActiveModal(null)}
                title={ModalTitle}
                footer={(
                    <Space size={16} direction='horizontal'>
                        <LinkWithIcon
                            title={BackMessage}
                            size='large'
                            onClick={() => setActiveModal('choose')}
                            PrefixIcon={ArrowLeft}
                        />
                        <Form.Item shouldUpdate>
                            {
                                ({ getFieldsError }) => {
                                    const errors = getFieldsError(['phone', 'file'])
                                        .flatMap(obj => obj.errors)

                                    return (
                                        <Button
                                            type='primary'
                                            onClick={() => uploadForm.submit()}
                                            disabled={!isEmpty(errors) || filesUploading || isEmpty(files)}
                                            loading={loading}
                                        >
                                            {SubmitButtonLabel}
                                        </Button>
                                    )
                                }
                            }
                        </Form.Item>
                    </Space>
                )}
            >
                <Space size={40} direction='vertical'>
                    <Typography.Text size='large' type='secondary'>
                        {ModalBodyText}
                    </Typography.Text>
                    <Alert
                        type='info'
                        message={AlertMessage}
                        description={AlertDescription}
                    />
                    <Form.Item
                        name='file'
                        valuePropName='fileList'
                    >
                        <UploadComponent
                            initialFileList={[]}
                            onFileListChange={(files) => {
                                setFiles(files)
                                const isFilesUploading = files.some(file => get(file, 'status') === 'uploading')
                                setFilesUploading(isFilesUploading)
                            }}
                        />
                    </Form.Item>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Typography.Text type='secondary'>
                                {PhoneCheckMessage}
                            </Typography.Text>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='phone'
                                label={PhoneLabel}
                                required
                                rules={[phoneValidator, requiredValidator]}
                                colon={false}
                                labelCol={{ span: 24 }}
                            >
                                <PhoneInput block/>
                            </Form.Item>
                        </Col>
                    </Row>
                </Space>
            </Modal>
        </FormWithAction>
    )
}

type ActiveModalType = 'choose' | 'call' | 'upload'
type ImportHelpModalProps = {
    domainName: string
    activeModal: ActiveModalType
    setActiveModal: Dispatch<SetStateAction<ActiveModalType>>
}

export const ImportHelpModal: React.FC<ImportHelpModalProps> = ({ domainName, activeModal, setActiveModal }) => {
    const intl = useIntl()
    const ModalTitle = intl.formatMessage({ id: 'import.helpModal.title' })
    const ChooseVariantMessage = intl.formatMessage({ id: 'import.helpModal.chooseVariant' })
    const ReadInstructionsCardTitle = intl.formatMessage({ id: 'import.helpModal.readInstruction.title' })
    const ReadInstructionsCardBody = intl.formatMessage({ id: 'import.helpModal.readInstruction.body' })
    const ImportFileCardTitle = intl.formatMessage({ id: 'import.helpModal.importFile.card.title' })
    const ImportFileCardBody = intl.formatMessage({ id: 'import.helpModal.importFile.card.body' })
    const RequestCallMessage = intl.formatMessage({ id: 'import.helpModal.callback' })

    const locale = useMemo(() => get(intl, 'locale'), [intl])
    const instructionUrl = useMemo(() => get(importInstructionUrl, [locale, domainName]), [domainName, locale])

    if (!activeModal) return null

    return (
        <>
            <UserHelpModal
                open={activeModal === 'choose'}
                onCancel={() => setActiveModal(null)}
                title={ModalTitle}
            >
                <Space size={40} direction='vertical'>
                    <Typography.Text size='medium' type='secondary'>
                        {ChooseVariantMessage}
                    </Typography.Text>
                    <Space size={20} direction='vertical' align='end'>
                        <CardsWrapper hasInstructionCard={Boolean(instructionUrl)}>
                            {
                                instructionUrl && (
                                    <Card.CardButton
                                        onClick={() => window.open(instructionUrl, '_blank')}
                                        header={{
                                            emoji: [{ symbol: '📄' }],
                                            headingTitle: ReadInstructionsCardTitle,
                                        }}
                                        body={{
                                            description: ReadInstructionsCardBody,
                                        }}
                                    />
                                )
                            }
                            <Card.CardButton
                                onClick={() => setActiveModal('upload')}
                                header={{
                                    emoji: [{ symbol: '🙀' }],
                                    headingTitle: ImportFileCardTitle,
                                }}
                                body={{
                                    description: ImportFileCardBody,
                                }}
                            />
                        </CardsWrapper>
                        <LinkWithIcon
                            title={RequestCallMessage}
                            size='large'
                            PostfixIcon={Phone}
                            onClick={() => setActiveModal('call')}
                        />
                    </Space>
                </Space>
            </UserHelpModal>
            <CallBackModal
                activeModal={activeModal}
                setActiveModal={setActiveModal}
                domainName={domainName}
            />
            <FileImportModal
                activeModal={activeModal}
                setActiveModal={setActiveModal}
                domainName={domainName}
            />
        </>
    )
}

export const useImportHelpModal = ({ domainName }) => {
    const [activeModal, setActiveModal] = useState<ActiveModalType>()
    const openImportHelpModal = useCallback(() => setActiveModal('choose'), [])

    const Modal = useCallback(() => (
        <ImportHelpModal
            domainName={domainName}
            activeModal={activeModal}
            setActiveModal={setActiveModal}
        />
    ), [activeModal, domainName])

    return useMemo(() => ({ Modal, openImportHelpModal }), [Modal, openImportHelpModal])
}
