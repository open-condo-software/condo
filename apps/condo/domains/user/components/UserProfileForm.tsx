import { jsx } from '@emotion/react/dist/emotion-react.cjs'
import { Col, Form, Row, Space, Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'


import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { Button as DeprecatedButton } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import Prompt from '@condo/domains/common/components/Prompt'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { EMAIL_ALREADY_REGISTERED_ERROR } from '@condo/domains/user/constants/errors'
import { User } from '@condo/domains/user/utils/clientSchema'

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

export const UserProfileForm = () => {
    const intl = useIntl()
    const router = useRouter()
    const FullNameLabel = intl.formatMessage({ id: 'auth.register.field.name' })
    const EmailLabel = intl.formatMessage({ id: 'field.eMail' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.email' })
    const PasswordLabel = intl.formatMessage({ id: 'auth.signin.field.password' })
    const ApplyChangesMessage = intl.formatMessage({ id: 'applyChanges' })
    const MinLengthError = intl.formatMessage({ id: 'field.clientName.minLengthError' })
    const ProfileUpdateTitle = intl.formatMessage({ id: 'profile.update' })
    const EmailIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'auth.emailIsAlreadyRegistered' })
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.changePassword' })
    const PromptTitle = intl.formatMessage({ id: 'form.prompt.title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'form.prompt.message' })
    const CancelLabel = intl.formatMessage({ id: 'cancel' })

    const { user } = useAuth()
    const updateUserAction = User.useUpdate({}, () => router.push('/user/'))
    const formAction = (formValues) => updateUserAction(formValues, user)
    const { breakpoints } = useLayoutContext()

    const onCancel = useCallback(() => {
        router.push('/user')
    }, [router])

    const { requiredValidator, emailValidator, changeMessage, minLengthValidator } = useValidations()
    const minClientNameRule = changeMessage(minLengthValidator(2), MinLengthError)
    const validations = {
        email: [emailValidator],
        name: [requiredValidator, minClientNameRule],
    }

    const initialValues = {
        name: get(user, 'name'),
        email: get(user, 'email'),
        avatar: get(user, 'avatar'),
    }
    const ErrorToFormFieldMsgMapping = {
        [EMAIL_ALREADY_REGISTERED_ERROR]: {
            name: 'email',
            errors: [EmailIsAlreadyRegisteredMsg],
        },
    }

    const handleResetPasswordAction = useCallback(() => {
        return router.push(RESET_PASSWORD_URL)
    }, [router])

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
                                            label={FullNameLabel}
                                            rules={validations.name}
                                        >
                                            <Input/>
                                        </Form.Item>
                                    </Col>
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
                                    <Col span={24}>
                                        <Form.Item {...INPUT_LAYOUT_PROPS} labelAlign='left' label={PasswordLabel}>
                                            <DeprecatedButton
                                                type='inlineLink'
                                                onClick={handleResetPasswordAction}
                                            >
                                                {ChangePasswordLabel}
                                            </DeprecatedButton>
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

