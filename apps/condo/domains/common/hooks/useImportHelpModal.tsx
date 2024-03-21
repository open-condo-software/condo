import styled from '@emotion/styled'
import { Col, Form, notification, Row, Space } from 'antd'
import get from 'lodash/get'
import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'

import { ArrowLeft, Phone } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Card, Modal, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'

import { useValidations } from './useValidations'

import { UserHelpRequest, UserHelpRequestFile } from '../../onboarding/utils/clientSchema'


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
const CallModal = styled(Modal)`
  &.condo-modal .condo-modal-header {
    padding: 40px 40px 20px 40px;
  }
`

type ActiveModalType = 'choose' | 'call' | 'upload'
type ImportHelpModalProps = {
    domainName: string
    activeModal: ActiveModalType
    setActiveModal: Dispatch<SetStateAction<ActiveModalType>>
}

export const ImportHelpModal: React.FC<ImportHelpModalProps> = ({ domainName, activeModal, setActiveModal }) => {
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

    const [callForm] = Form.useForm()
    const [uploadForm] = Form.useForm()

    const { UploadComponent, syncModifiedFiles } = useMultipleFileUploadHook({
        Model: UserHelpRequestFile,
        relationField: 'userHelpRequest',
        initialFileList: [],
    })

    const callFormAction = useCallback(async values => {
        await createHelpRequestAction({
            type: 'callback',
            phone: get(values, 'phone'),
        })

        setActiveModal(null)
    }, [createHelpRequestAction, setActiveModal])

    const uploadFormAction = useCallback(async values => {
        const helpRequest = await createHelpRequestAction({
            type: 'importFile',
            phone: get(values, 'phone'),
            isReadyToSend: false,
        })

        await syncModifiedFiles(helpRequest.id)

        await updateHelpRequestAction({
            isReadyToSend: true,
        }, helpRequest)
        setActiveModal(null)
    }, [createHelpRequestAction, setActiveModal, syncModifiedFiles, updateHelpRequestAction])

    return (
        <>
            <Modal
                open={activeModal === 'choose'}
                onCancel={() => setActiveModal(null)}
                title={(
                    <Space size={8} direction='vertical'>
                        <Typography.Title level={3}>
                            Мы обязательно поможем
                        </Typography.Title>
                        <Typography.Text size='medium' type='secondary'>
                            Выберите наиболее удобный вариант:
                        </Typography.Text>
                    </Space>
                )}
            >
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
            </Modal>
            <CallModal
                open={activeModal === 'call'}
                onCancel={() => setActiveModal(null)}
                title={(
                    <Space size={8} direction='vertical'>
                        <Typography.Title level={3}>
                            Проверьте номер телефона
                        </Typography.Title>
                        <Typography.Text size='medium' type='secondary'>

                            Менеджер позвонит в течение 40 минут и поможет разобраться
                        </Typography.Text>
                    </Space>
                )}
                footer={(
                    <Space size={16} direction='horizontal'>
                        <LinkWithIcon
                            title='Назад'
                            size='large'
                            onClick={() => setActiveModal('choose')}
                            PrefixIcon={ArrowLeft}
                        />
                        <Button
                            type='primary'
                            onClick={() => callForm.submit()}
                        >
                            Номер верный — звоните
                        </Button>
                    </Space>
                )}
            >
                <FormWithAction
                    action={callFormAction}
                    initialValues={initialValues}
                    layout='vertical'
                    validateTrigger={['onBlur', 'onSubmit']}
                    formInstance={callForm}
                    OnCompletedMsg='Отправлено'
                >
                    <Form.Item
                        name='phone'
                        label='Номер телефона'
                        required
                        rules={[phoneValidator, requiredValidator]}
                    >
                        <PhoneInput block/>
                    </Form.Item>
                </FormWithAction>
            </CallModal>
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
                        <Button
                            type='primary'
                            onClick={() => uploadForm.submit()}
                        >
                            Загрузить
                        </Button>
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
                    <FormWithAction
                        action={uploadFormAction}
                        initialValues={initialValues}
                        layout='vertical'
                        validateTrigger={['onBlur', 'onSubmit']}
                        formInstance={uploadForm}
                        OnCompletedMsg='Отправлено'
                    >
                        <Row gutter={[0, 24]}>
                            <Col span={24}>
                                <Form.Item
                                    name='phone'
                                    label='Номер телефона'
                                    required
                                    rules={[phoneValidator, requiredValidator]}
                                >
                                    <PhoneInput block/>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name='file' valuePropName='fileList'>
                                    <UploadComponent initialFileList={[]} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </FormWithAction>
                </Space>
            </Modal>
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
    ), [activeModal])

    return useMemo(() => ({ Modal, openImportHelpModal }), [Modal, openImportHelpModal])
}
