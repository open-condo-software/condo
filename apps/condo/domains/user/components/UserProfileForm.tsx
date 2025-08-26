import { useUpdateUserMutation } from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Typography, Input } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import Prompt from '@condo/domains/common/components/Prompt'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { EMAIL_ALREADY_REGISTERED_ERROR } from '@condo/domains/user/constants/errors'
import { PHONE_TYPE } from '@condo/domains/user/constants/identifiers'

import { UserAvatar } from './UserAvatar'


const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 9,
    },
    wrapperCol: {
        span: 15,
    },
    style: {
        maxWidth: '453px',
    },
}

const RESET_PASSWORD_URL = '/auth/forgot'

const { publicRuntimeConfig: { inviteRequiredFields } } = getConfig()

const isEmailEditable = Array.isArray(inviteRequiredFields)
    && inviteRequiredFields.length === 1
    && inviteRequiredFields.includes(PHONE_TYPE)

export const UserProfileForm: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const FullNameLabel = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const PasswordLabel = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const MinLengthError = intl.formatMessage({ id: 'field.ClientName.minLengthError' })
    const MaxLengthError = intl.formatMessage({ id: 'field.ClientName.maxLengthError' })
    const ProfileUpdateTitle = intl.formatMessage({ id: 'profile.Update' })
    const EmailIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsAlreadyRegistered' })
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePassword' })
    const PromptTitle = intl.formatMessage({ id: 'form.prompt.title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'form.prompt.message' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })

    const { user } = useAuth()
    const [updateUserAction] = useUpdateUserMutation({
        onCompleted: () => router.push('/user'), 
    })
    const formAction = (formValues) => updateUserAction({
        variables: {
            id: user.id,
            data: {
                ...formValues,
                dv: 1,
                sender: getClientSideSenderInfo(),
            },
        },
    })
    const { breakpoints } = useLayoutContext()

    const onCancel = useCallback(() => {
        router.push('/user')
    }, [router])

    const { requiredValidator, emailValidator, changeMessage, minLengthValidator, maxLengthValidator } = useValidations()
    const minClientNameRule = changeMessage(minLengthValidator(2), MinLengthError)
    const maxClientNameRule = changeMessage(maxLengthValidator(100), MaxLengthError)
    const validations = {
        email: [emailValidator],
        name: [requiredValidator, minClientNameRule, maxClientNameRule],
    }

    const initialValues = useMemo(() => ({
        name: user?.name,
        email: user?.email,
        avatar: user?.avatar,
    }), [user])
    const ErrorToFormFieldMsgMapping = {
        [EMAIL_ALREADY_REGISTERED_ERROR]: {
            name: 'email',
            errors: [EmailIsAlreadyRegisteredMsg],
        },
    }

    return (
        <FormWithAction
            action={formAction}
            initialValues={initialValues}
            layout='horizontal'
            ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
            validateTrigger={['onBlur', 'onSubmit']}
        >
            {({ handleSave, isLoading, form }) => {
                return (
                    <>
                        <Prompt
                            title={PromptTitle}
                            form={form}
                            handleSave={handleSave}
                        >
                            <Typography.Paragraph>
                                {PromptHelpMessage}
                            </Typography.Paragraph>
                        </Prompt>
                        <Row gutter={[0, 40]} justify='center'>
                            <Col xs={10} lg={3}>
                                <UserAvatar borderRadius={24}/>
                            </Col>
                            <Col lg={20} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                                <Row gutter={[0, 40]}>
                                    <Col span={24}>
                                        <Typography.Title level={1}>
                                            {ProfileUpdateTitle}
                                        </Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign='left'
                                            name='name'
                                            label={FullNameLabel}
                                            rules={validations.name}
                                        >
                                            <Input/>
                                        </Form.Item>
                                    </Col>
                                    {
                                        isEmailEditable && (
                                            <Col span={24}>
                                                <Form.Item
                                                    {...INPUT_LAYOUT_PROPS}
                                                    labelAlign='left'
                                                    name='email'
                                                    label={EmailLabel}
                                                    rules={validations.email}
                                                >
                                                    <Input placeholder={ExampleEmailMessage}/>
                                                </Form.Item>
                                            </Col>
                                        )
                                    }

                                    <Col span={24}>
                                        <Form.Item {...INPUT_LAYOUT_PROPS} labelAlign='left' label={PasswordLabel}>
                                            <Link href={RESET_PASSWORD_URL}>
                                                <Typography.Link href={RESET_PASSWORD_URL}>
                                                    {ChangePasswordLabel}
                                                </Typography.Link>
                                            </Link>
                                        </Form.Item>
                                    </Col>

                                    <Col span={24}>
                                        <ActionBar
                                            actions={[
                                                <Button
                                                    key='submit'
                                                    onClick={handleSave}
                                                    type='primary'
                                                    loading={isLoading}
                                                >
                                                    {ApplyChangesMessage}
                                                </Button>,
                                                <Button
                                                    key='cancel'
                                                    type='secondary'
                                                    onClick={onCancel}
                                                >
                                                    {CancelLabel}
                                                </Button>,
                                            ]}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </>
                )
            }}
        </FormWithAction>
    )
}

