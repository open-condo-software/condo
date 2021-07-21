import React, { useMemo } from 'react'
import { Col, Form, Input, Row, Space, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { Contact } from '../utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { Loader } from '@condo/domains/common/components/Loader'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { Rule } from 'rc-field-form/lib/interface'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { Button } from '@condo/domains/common/components/Button'
import { canManageContacts } from '@condo/domains/organization/permissions'
const { normalizePhone } = require('@condo/domains/common/utils/phone')

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 11,
    },
    wrapperCol: {
        span: 13,
    },
    style: {
        paddingBottom: '24px',
        maxWidth: '453px',
    },
}

export const EditContactForm: React.FC = () => {
    const intl = useIntl()
    const ErrorMessage = intl.formatMessage({ id: 'errors.PdfGenerationError' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const ContactNotFoundTitle = intl.formatMessage({ id: 'Contact.NotFound.Title' })
    const ContactNotFoundMessage = intl.formatMessage({ id: 'Contact.NotFound.Message' })
    const ProfileUpdateTitle = intl.formatMessage({ id: 'EditingContact' })
    const NameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const FullNameRequiredMessage = intl.formatMessage({ id: 'field.FullName.requiredError' })
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const PhoneIsNotValidMessage = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const FullNamePlaceholderMessage = intl.formatMessage({ id:'field.FullName' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const NoPermissionMessage = intl.formatMessage({ id: 'EditingContactNoPermission' })

    const { query, push } = useRouter()
    const { organization, link } = useOrganization()
    const contactId = get(query, 'id', '')
    const {
        obj: contact,
        loading,
        error,
        refetch,
    } = Contact.useObject({
        where: {
            id: String(contactId),
            organization: {
                id: String(organization.id),
            },
        },
    })

    // @ts-ignore
    const contactUpdateAction = Contact.useUpdate({}, () => {
        refetch().then(() => {
            push(`/contact/${contactId}`)
        })
    })

    const validations: { [key: string]: Rule[] } = useMemo(() => {
        return {
            phone: [
                {
                    required: true,
                    message: FieldIsRequiredMessage,
                },
                {
                    validator: (_, value) => {
                        const v = normalizePhone(value)
                        if (!v) return Promise.reject(PhoneIsNotValidMessage)
                        return Promise.resolve()
                    },
                },
            ],
            email: [
                {
                    type: 'email',
                    message: EmailErrorMessage,
                },
            ],
            name: [
                {
                    required: true,
                    message: FullNameRequiredMessage,
                },
                {
                    validator: (_, value) => {
                        if (value.trim().length === 0) return Promise.reject(FullNameRequiredMessage)
                        return Promise.resolve()
                    },
                },
            ],
        }
    }, [FieldIsRequiredMessage, PhoneIsNotValidMessage, EmailErrorMessage, FullNameRequiredMessage])

    if (error) {
        return <LoadingOrErrorPage title={LoadingMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }
    if (loading) {
        return <Loader />
    }
    if (!contact) {
        return <LoadingOrErrorPage title={ContactNotFoundTitle} loading={false} error={ContactNotFoundMessage}/>
    }

    const isContactEditable = canManageContacts(link, contact)

    if (!isContactEditable) {
        return <LoadingOrErrorPage title={ProfileUpdateTitle} loading={false} error={NoPermissionMessage}/>
    }

    const formAction = (formValues) => {
        return contactUpdateAction(formValues, contact)
    }
    const formInitialValues = {
        name: get(contact, 'name'),
        phone: get(contact, 'phone'),
        email: get(contact, 'email'),
    }

    return (
        <>
            <FormWithAction
                action={formAction}
                initialValues={formInitialValues}
                layout={'horizontal'}
                validateTrigger={['onBlur', 'onSubmit']}
            >
                {
                    ({ handleSave, isLoading }) => {
                        return (
                            <Row>
                                <Col span={3}>
                                    <UserAvatar borderRadius={24}/>
                                </Col>
                                <Col span={20} push={1}>
                                    <Row gutter={[0, 40]}>
                                        <Col span={24}>
                                            <Typography.Title
                                                level={1}
                                                style={{ margin: 0, fontWeight: 'bold' }}
                                            >
                                                {ProfileUpdateTitle}
                                            </Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign={'left'}
                                                name={'name'}
                                                label={NameLabel}
                                                required={true}
                                                validateFirst
                                                rules={validations.name}
                                            >
                                                <Input placeholder={FullNamePlaceholderMessage}/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign={'left'}
                                                name={'phone'}
                                                label={PhoneLabel}
                                                required={true}
                                                validateFirst
                                                rules={validations.phone}
                                            >
                                                <PhoneInput placeholder={ExamplePhoneMessage} style={{ width: '100%' }}/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign={'left'}
                                                name={'email'}
                                                label={EmailLabel}
                                                required={false}
                                                validateFirst
                                                rules={validations.email}
                                            >
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                        <Space size={40} style={{ paddingTop: '36px' }}>
                                            <FormResetButton
                                                type={'sberPrimary'}
                                                secondary
                                            />
                                            <Button
                                                key={'submit'}
                                                onClick={handleSave}
                                                type={'sberPrimary'}
                                                loading={isLoading}
                                            >
                                                {ApplyChangesMessage}
                                            </Button>
                                        </Space>
                                    </Row>
                                </Col>
                            </Row>
                        )
                    }
                }
            </FormWithAction>
        </>
    )
}