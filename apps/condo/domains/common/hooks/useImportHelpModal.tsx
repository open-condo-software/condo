import styled from '@emotion/styled'
import { Col, Form, Row, Space } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'

import { ArrowLeft, Phone } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Card, Modal, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { UserHelpRequest, UserHelpRequestFile } from '@condo/domains/onboarding/utils/clientSchema'

import { useValidations } from './useValidations'


const CardsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;

  & .condo-card {
    width: 240px;
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
            OnCompletedMsg='Отправлено'
        >
            <UserHelpModal
                open={activeModal === 'call'}
                onCancel={() => setActiveModal(null)}
                title='Проверьте номер телефона'
                footer={(
                    <Space size={16} direction='horizontal'>
                        <LinkWithIcon
                            title='Назад'
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
                                            Номер верный — звоните
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
                            Менеджер позвонит в течение 40 минут и поможет разобраться
                        </Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='phone'
                            label='Номер телефона'
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
            OnCompletedMsg='Отправлено'
        >
            <Modal
                open={activeModal === 'upload'}
                onCancel={() => setActiveModal(null)}
                title='Загрузить в другом формате'
                footer={(
                    <Space size={16} direction='horizontal'>
                        <LinkWithIcon
                            title='Назад'
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
                                            disabled={!isEmpty(errors) || filesUploading}
                                            loading={loading}
                                        >
                                            Загрузить
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
                        Информацию можно загрузить в другом формате: Excel-таблицы с другими полями, фото документов, выгрузки из CRM и т. д.
                    </Typography.Text>
                    <Alert
                        type='info'
                        message='Загрузка займет от 1 до 3 рабочих дней'
                        description='Менеджер будет добавлять информацию вручную. Мы позвоним и сообщим, когда все будет готово.'
                    />
                    <Form.Item
                        name='file'
                        valuePropName='fileList'
                    >
                        <UploadComponent
                            initialFileList={[]}
                            onFileListChange={(files) => {
                                const isFilesUploading = files.some(file => get(file, 'status') === 'uploading')
                                setFilesUploading(isFilesUploading)
                            }}
                        />
                    </Form.Item>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Typography.Text type='secondary'>
                                Проверьте ваш номер телефона, чтобы мы могли оперативно с вами связаться, если у нас возникнут вопросы по файлу.
                            </Typography.Text>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='phone'
                                label='Номер телефона'
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
    if (!activeModal) return null

    return (
        <>
            <UserHelpModal
                open={activeModal === 'choose'}
                onCancel={() => setActiveModal(null)}
                title='Мы обязательно поможем'
            >
                <Space size={40} direction='vertical'>
                    <Typography.Text size='medium' type='secondary'>
                        Выберите наиболее удобный вариант:
                    </Typography.Text>
                    <Space size={20} direction='vertical' align='end'>
                        <CardsWrapper>
                            <Card.CardButton
                                header={{
                                    emoji: [{ symbol: '📄' }],
                                    headingTitle: 'Изучить инструкцию',
                                }}
                                body={{
                                    description: 'Мы подготовили подробный документ с примерами',
                                }}
                            />
                            <Card.CardButton
                                onClick={() => setActiveModal('upload')}
                                header={{
                                    emoji: [{ symbol: '🙀' }],
                                    headingTitle: 'Загрузить данные в другом формате',
                                }}
                                body={{
                                    description: 'Объемные данные в нестандартном формате можно отправить менеджеру – он добавит их на платформу.',
                                }}
                            />
                        </CardsWrapper>
                        <LinkWithIcon
                            title='Заказать звонок'
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
