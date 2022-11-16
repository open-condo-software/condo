import Input from '@condo/domains/common/components/antd/Input'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { Contact, ContactRole } from '@condo/domains/contact/utils/clientSchema'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Col, Form, Row, Space, Typography } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { CSSProperties, useMemo } from 'react'
import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { fontSizes } from '@condo/domains/common/constants/style'
import { getObjectValueFromQuery } from '../../common/utils/query'
import { ClientType, getClientCardTabKey } from '../utils/clientCard'
import { ContactRoleSelect } from './contactRoles/ContactRoleSelect'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 11,
    },
    wrapperCol: {
        span: 13,
    },
    colon: false,
}

const GUTTER_0_40: [Gutter, Gutter] = [0, 40]
const CHECKBOX_STYLE: CSSProperties = { paddingLeft: '0px', fontSize: fontSizes.content }

export const EditContactForm: React.FC = () => {
    const intl = useIntl()
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const ContactNotFoundTitle = intl.formatMessage({ id: 'Contact.NotFound.Title' })
    const ContactNotFoundMessage = intl.formatMessage({ id: 'Contact.NotFound.Message' })
    const ProfileUpdateTitle = intl.formatMessage({ id: 'EditingContact' })
    const NameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const FullNamePlaceholderMessage = intl.formatMessage({ id: 'field.FullName' })
    const FullNameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const NoPermissionMessage = intl.formatMessage({ id: 'EditingContactNoPermission' })
    const RoleLabel = intl.formatMessage({ id: 'ContactRole' })
    const Verified = intl.formatMessage({ id: 'pages.condo.contact.Verified' })

    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const { organization, link } = useOrganization()
    const contactId = get(router, 'query.id', '')

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

    const {
        objs: roles,
    } = ContactRole.useObjects({
        where: {
            OR: [
                { organization_is_null: true },
                { organization: { id: get(organization, 'id', null) } },
            ],
        },
    })

    const redirectToClientCard = useMemo(() => !!get(router, ['query', 'redirectToClientCard']), [router])

    const contactUpdateAction = Contact.useUpdate({}, async (contact) => {
        await refetch()
        if (redirectToClientCard) {
            const phone = contact.phone
            const propertyId = get(contact, 'property.id')
            if (phone && propertyId) {
                await router.push(`/phone/${phone}?tab=${getClientCardTabKey(propertyId, ClientType.Resident, contact.unitName)}`)
            }
        } else {
            await router.push('/contact/')
        }
    })

    const formInitialValues = useMemo(() => ({
        name: get(contact, 'name'),
        phone: get(contact, 'phone'),
        email: get(contact, 'email'),
        role: get(contact, ['role', 'id']),
        isVerified: get(contact, 'isVerified'),
    }), [contact])

    const { requiredValidator, phoneValidator, emailValidator, trimValidator, changeMessage, specCharValidator } = useValidations({ allowLandLine: true })
    const validations = {
        phone: [requiredValidator, phoneValidator],
        email: [emailValidator],
        name: [
            requiredValidator,
            trimValidator,
            changeMessage(specCharValidator, FullNameInvalidCharMessage),
        ],
    }

    if (error) {
        return <LoadingOrErrorPage title={LoadingMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }
    if (loading) {
        return <Loader/>
    }
    if (!contact) {
        return <LoadingOrErrorPage title={ContactNotFoundTitle} loading={false} error={ContactNotFoundMessage}/>
    }

    const isContactEditable = get(link, ['role', 'canManageContacts'], null)

    if (!isContactEditable) {
        return <LoadingOrErrorPage title={ProfileUpdateTitle} loading={false} error={NoPermissionMessage}/>
    }

    const formAction = (formValues) => {
        return contactUpdateAction(formValues, contact)
    }

    return (
        <>
            <FormWithAction
                action={formAction}
                initialValues={formInitialValues}
                layout='horizontal'
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={(values) => {
                    const role = get(values, 'role', null)
                    values.role = role ? { connect: { id: String(role) } } : { disconnectAll: true }

                    return values
                }}
            >
                {
                    ({ handleSave, isLoading }) => {
                        return (
                            <Row gutter={GUTTER_0_40} justify='center'>
                                <Col xs={10} lg={3}>
                                    <UserAvatar borderRadius={24}/>
                                </Col>
                                <Col xs={24} lg={15} offset={isSmall ? 0 : 1}>
                                    <Row gutter={GUTTER_0_40}>
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
                                                labelAlign='left'
                                                name='name'
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
                                                labelAlign='left'
                                                name='phone'
                                                label={PhoneLabel}
                                                required={true}
                                                validateFirst
                                                rules={validations.phone}
                                            >
                                                <PhoneInput placeholder={ExamplePhoneMessage} block/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign='left'
                                                name='email'
                                                label={EmailLabel}
                                                required={false}
                                                validateFirst
                                                rules={validations.email}
                                            >
                                                <Input placeholder={ExampleEmailMessage}/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign='left'
                                                name='role'
                                                label={RoleLabel}
                                            >
                                                <ContactRoleSelect roles={roles}/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign='left'
                                                name='isVerified'
                                                label={Verified}
                                                valuePropName='checked'
                                            >
                                                <Checkbox
                                                    style={CHECKBOX_STYLE}
                                                    eventName='ContactIsVerifiedCheckbox'
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Space size={40} style={{ paddingTop: '36px' }}>
                                            <FormResetButton
                                                type='sberPrimary'
                                                secondary
                                            />
                                            <Button
                                                key='submit'
                                                onClick={handleSave}
                                                type='sberPrimary'
                                                loading={isLoading}
                                            >
                                                {ApplyChangesMessage}
                                            </Button>
                                        </Space>
                                    </Row>
                                </Col>
                                <Col xs={24} lg={5}/>
                            </Row>
                        )
                    }
                }
            </FormWithAction>
        </>
    )
}
