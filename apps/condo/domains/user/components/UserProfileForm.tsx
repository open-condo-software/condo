import { Form, Input, Space } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { User } from '@condo/domains/user/utils/clientSchema'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { UserPasswordResetButton } from './UserPasswordResetButton'

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

export const UserProfileForm = () => {
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const PasswordLabel = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const EmailIsNotValidMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const PleaseInputYourEmailMessage = intl.formatMessage({ id: 'pages.auth.PleaseInputYourEmail' })
    const MinLengthError = intl.formatMessage({ id: 'field.ClientName.minLengthError' })

    const { user, refetch } = useAuth()
    const updateUserAction = User.useUpdate({}, refetch)
    const formAction = (formValues) => updateUserAction(formValues, user)

    const initialValues = {
        name: get(user, 'name'),
        email: get(user, 'email'),
    }

    return (
        <>
            <FormWithAction
                action={formAction}
                initialValues={initialValues}
                layout={'horizontal'}
                validateTrigger={['onBlur', 'onSubmit', 'onChange']}
            >
                {({ handleSave, isLoading }) => {
                    return (
                        <>
                            <Form.Item
                                {...INPUT_LAYOUT_PROPS}
                                labelAlign={'left'}
                                name={'name'}
                                label={FullNameLabel}
                                rules={[
                                    {
                                        required: true,
                                        min: 2,
                                        type: 'string',
                                        message: MinLengthError,
                                    },
                                ]}
                            >
                                <Input/>
                            </Form.Item>
                            <Form.Item
                                {...INPUT_LAYOUT_PROPS}
                                labelAlign={'left'}
                                name={'email'}
                                label={EmailLabel}
                                rules={[
                                    {
                                        type: 'email',
                                        message: EmailIsNotValidMessage,
                                    },
                                    {
                                        required: true,
                                        message: PleaseInputYourEmailMessage,
                                    },
                                ]}
                            >
                                <Input/>
                            </Form.Item>
                            <Form.Item {...INPUT_LAYOUT_PROPS} labelAlign={'left'} label={PasswordLabel}>
                                <UserPasswordResetButton/>
                            </Form.Item>
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
                        </>
                    )
                }}
            </FormWithAction>
        </>
    )
}

