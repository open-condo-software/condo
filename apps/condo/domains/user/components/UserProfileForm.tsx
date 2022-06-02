import React, { useCallback } from 'react'
import { Col, Form, Row, Space, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { User } from '@condo/domains/user/utils/clientSchema'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { UserAvatar } from './UserAvatar'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { EMAIL_ALREADY_REGISTERED_ERROR } from '@condo/domains/user/constants/errors'

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
    const FullNameLabel = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const PasswordLabel = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const MinLengthError = intl.formatMessage({ id: 'field.ClientName.minLengthError' })
    const ProfileUpdateTitle = intl.formatMessage({ id: 'profile.Update' })
    const EmailIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsAlreadyRegistered' })
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePassword' })

    const { user } = useAuth()
    const updateUserAction = User.useUpdate({}, () => router.push('/user/'))
    const formAction = (formValues) => updateUserAction(formValues, user)
    const { isSmall } = useLayoutContext()

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
            layout={'horizontal'}
            ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
            validateTrigger={['onBlur', 'onSubmit']}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Row gutter={[0, 40]} justify={'center'}>
                        <Col xs={10} lg={3}>
                            <UserAvatar borderRadius={24}/>
                        </Col>
                        <Col lg={20} offset={isSmall ? 0 : 1}>
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
                                        label={FullNameLabel}
                                        rules={validations.name}
                                    >
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        {...INPUT_LAYOUT_PROPS}
                                        labelAlign={'left'}
                                        name={'email'}
                                        label={EmailLabel}
                                        rules={validations.email}
                                    >
                                        <Input placeholder={ExampleEmailMessage}/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item {...INPUT_LAYOUT_PROPS} labelAlign={'left'} label={PasswordLabel}>
                                        <Button
                                            type={'inlineLink'}
                                            onClick={handleResetPasswordAction}
                                        >
                                            {ChangePasswordLabel}
                                        </Button>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
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
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                )
            }}
        </FormWithAction>
    )
}

