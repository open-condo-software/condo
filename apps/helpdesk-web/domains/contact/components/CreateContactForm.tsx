import { useApolloClient } from '@apollo/client'
import {
    useCreateContactMutation,
} from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import {
    ActionBar,
    Checkbox,
} from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { getObjectValueFromQuery } from '@condo/domains/common/utils/query'
import { UNABLE_TO_CREATE_CONTACT_DUPLICATE, UNABLE_TO_UPDATE_CONTACT_DUPLICATE } from '@condo/domains/user/constants/errors'
import { usePropertyOrCreate } from '@helpdesk-web/domains/ticket/hooks/usePropertyOrCreate'

import type { FormRule as Rule } from 'antd'


const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 6,
    },
    wrapperCol: {
        span: 10,
    },
    style: {
        paddingBottom: '12px',
    },
    colon: false,
}

const PLACEHOLDER_PROPERTY_ID = 'null-property-placeholder'
const PLACEHOLDER_ROLE_ID = 'null-role-placeholder'
const PLACEHOLDER_UNIT_NAME = 'N/A'


export const CreateContactForm: React.FC = () => {
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const FullNamePlaceholderMessage = intl.formatMessage({ id: 'field.FullName' })
    const FullNameInvalidCharMessage = intl.formatMessage({ id: 'field.FullName.invalidChar' })
    const FullNameRequiredMessage = intl.formatMessage({ id: 'field.FullName.requiredError' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const SubmitButtonLabel = intl.formatMessage({ id: 'AddContact' })
    const ContactDuplicateError = intl.formatMessage({ id: 'contact.ContactDuplicateError' })
    const Verified = intl.formatMessage({ id: 'pages.condo.contact.Verified' })
    const NameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const ContactDuplicateMessage = intl.formatMessage({ id: 'contact.ContactDuplicateError' })

    const client = useApolloClient()
    const { organization, role } = useOrganization()
    const router = useRouter()
    const initialValuesFromQuery = useMemo(() => getObjectValueFromQuery(router, ['initialValues']), [router])

    const [isFieldsChanged, setIsFieldsChanged] = useState(false)

    const {
        changeMessage,
        phoneValidator,
        emailValidator,
        requiredValidator,
        specCharValidator,
        trimValidator,
    } = useValidations({ allowLandLine: true })
    
    const validations: { [key: string]: Rule[] } = {
        phone: [requiredValidator, phoneValidator],
        email: [changeMessage(emailValidator, EmailErrorMessage)],
        name: [
            changeMessage(trimValidator, FullNameRequiredMessage),
            changeMessage(specCharValidator, FullNameInvalidCharMessage),
        ],
    }

    const ErrorToFormFieldMsgMapping = {
        [UNABLE_TO_UPDATE_CONTACT_DUPLICATE]: {
            name: '_NON_FIELD_ERROR_',
            errors: [ContactDuplicateError],
        },
        [UNABLE_TO_CREATE_CONTACT_DUPLICATE]: {
            name: '_NON_FIELD_ERROR_',
            errors: [ContactDuplicateError],
        },
    }

    const [createContactMutation] = useCreateContactMutation()
    const { property } = usePropertyOrCreate()

    const actionWithHandleSubmit = useCallback(async (data) => {
        setIsFieldsChanged(false)
        await createContactMutation({
            variables: {
                data: {
                    ...data,
                    property: { connect: { id: property.id } },
                    organization: { connect: { id: organization.id } },
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                },
            },
        })

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allContacts' })
        client.cache.gc()

        await router.push('/contact')
    }, [client.cache, createContactMutation, organization.id, router, property])

    const canManageContacts = role?.canManageContacts

    return (
        <FormWithAction
            action={actionWithHandleSubmit}
            initialValues={initialValuesFromQuery}
            layout='horizontal'
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
            onChange={() => setIsFieldsChanged(true)}
            ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
            isNonFieldErrorHidden
        >
            {
                ({ handleSave, isLoading }) => {

                    return (
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Row gutter={[0, 24]}>
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            name='name'
                                            label={FullNameLabel}
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign='left'
                                            required
                                            validateFirst
                                            rules={validations.name}>
                                            <Input placeholder={FullNamePlaceholderMessage} />
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            name='phone'
                                            label={PhoneLabel}
                                            labelAlign='left'
                                            required
                                            validateFirst
                                            rules={validations.phone}
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <PhoneInput placeholder={ExamplePhoneMessage} block />
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            name='email'
                                            label={EmailLabel}
                                            labelAlign='left'
                                            validateFirst
                                            rules={validations.email}
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Input placeholder={ExampleEmailMessage} />
                                        </Form.Item>
                                    </Col>
                                    {/* <Col lg={18} xs={24}>
                                        <Form.Item
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign='left'
                                            name='isVerified'
                                            label={Verified}
                                            valuePropName='checked'
                                        >
                                            <Checkbox
                                                id='contact-is-verified'
                                            />
                                        </Form.Item>
                                    </Col> */}
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Form.Item noStyle dependencies={['phone', 'name']} shouldUpdate>
                                    {
                                        ({ getFieldsValue, getFieldError }) => {
                                            const { phone, name } = getFieldsValue(['phone', 'name'])
                                            const hasDuplicateError = Boolean(getFieldError('_NON_FIELD_ERROR_').find((error => error.includes(ContactDuplicateError))))
                                            const hasNameSpecCharError = Boolean(getFieldError('name').find((error => error.includes(FullNameInvalidCharMessage))))
                                            const hasNameTrimValidateError = Boolean(getFieldError('name').find((error => error.includes(FullNameRequiredMessage))))
                                            const hasContactDuplicate = isFieldsChanged ? false : hasDuplicateError
                                            const isDisabled = !name
                                                || !phone
                                                || hasNameTrimValidateError
                                                || hasContactDuplicate
                                                || hasNameSpecCharError
                                                || !canManageContacts

                                            const messageLabels = []
                                            if (hasNameTrimValidateError || !name) messageLabels.push(`"${NameLabel}"`)
                                            if (!phone) messageLabels.push(`"${PhoneLabel}"`)

                                            const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
                                            const contactDuplicateError = hasContactDuplicate ? ContactDuplicateMessage : undefined
                                            const nameSpecCharError = hasNameSpecCharError ? FullNameInvalidCharMessage : undefined

                                            const errors = [requiredErrorMessage, contactDuplicateError, nameSpecCharError]
                                                .filter(Boolean)
                                                .join(', ')

                                            return (
                                                <ActionBar
                                                    actions={[
                                                        <ButtonWithDisabledTooltip
                                                            key='submit'
                                                            type='primary'
                                                            disabled={isDisabled}
                                                            title={errors}
                                                            onClick={handleSave}
                                                            loading={isLoading}
                                                        >
                                                            {SubmitButtonLabel}
                                                        </ButtonWithDisabledTooltip>,
                                                    ]}
                                                />
                                            )
                                        }
                                    }
                                </Form.Item>
                            </Col>
                        </Row>

                    )
                }
            }
        </FormWithAction>
    )
}
