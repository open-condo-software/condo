import { useIntl } from '@core/next/intl'
import { Form, Input, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import { FormattedMessage } from 'react-intl'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import Router from 'next/router'
import React, { useState } from 'react'

import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { START_PASSWORD_RECOVERY_MUTATION } from '@condo/domains/user/gql'

import { colors } from '@condo/domains/common/constants/style'

const LINK_STYLE = { color: colors.sberPrimary[7] }
const INPUT_STYLE = { width: '273px' }


const ResetPage = (): React.ReactElement  => {
    const [form] = Form.useForm()
    const queryParams = getQueryParams()
    const initialValues = { ...queryParams, password: '', confirm: '', email: '' }
    const intl = useIntl()
    const RestorePasswordMsg = intl.formatMessage({ id: 'pages.auth.reset.RestorePasswordTitle' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const EmailMsg = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const InstructionsMsg = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp' })
    const EmailIsNotRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotRegistered' })
    const PleaseInputYourEmailMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourEmail' })
    const CheckEmailMsg = intl.formatMessage({ id: 'pages.auth.reset.CheckEmail' })
    const ReturnToLoginPage = intl.formatMessage({ id: 'pages.auth.reset.ReturnToLoginPage' })

    const [isLoading, setIsLoading] = useState(false)
    const [isSuccessMessage, setIsSuccessMessage] = useState(false)
    const [startPasswordRecovery] = useMutation(START_PASSWORD_RECOVERY_MUTATION)
    const ErrorToFormFieldMsgMapping = {
        '[unknown-user]': {
            name: 'email',
            errors: [EmailIsNotRegisteredMsg],
        },
    }
    if (isLoading) {
        return <LoadingOrErrorPage title={ResetTitle} loading={isLoading} error={null}/>
    }

    if (isSuccessMessage) {
        return (
            <div style={{ maxWidth: '450px' }}>
                <Typography.Title style={{ textAlign: 'left' }}>{CheckEmailMsg}</Typography.Title>
                <Typography.Paragraph style={{ textAlign: 'left' }}>
                    <FormattedMessage id='pages.auth.reset.ResetSuccessMessage' values={{ email: form.getFieldValue('email') }} />
                </Typography.Paragraph>    
                <Typography.Paragraph style={{ textAlign: 'left' }}>
                    <a style={LINK_STYLE} onClick={() => Router.push('/auth/signin')}>{ReturnToLoginPage}</a>
                </Typography.Paragraph>    
            </div>
        )    
    }

    const onSubmit = values => {
        if (values.email) values.email = values.email.toLowerCase()
        setIsLoading(true)
        return runMutation({
            mutation: startPasswordRecovery,
            variables: values,
            onCompleted: () => {
                setIsLoading(false)
                setIsSuccessMessage(true)
            },
            finally: () => setIsLoading(false),
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(err => {
            setIsLoading(false)
        })
    }

    return (
        <div >
            <Typography.Title style={{ textAlign: 'left' }}>{ResetTitle}</Typography.Title>
            <Typography.Paragraph style={{ textAlign: 'left' }}>{InstructionsMsg}</Typography.Paragraph>    
            <Form
                form={form}
                name="forgot-password"
                onFinish={onSubmit}
                initialValues={initialValues}
                colon={false}
                style={{ marginTop: '40px' }}
            >
                <Form.Item
                    name="email"
                    label={EmailMsg}
                    rules={[{ required: true, message: PleaseInputYourEmailMsg }]}
                    labelAlign='left'
                    labelCol={{ flex: 1 }}                            
                >
                    <Input placeholder={'name@example.org'}  style={INPUT_STYLE}/>
                </Form.Item>
                <Form.Item style={{ textAlign: 'left', marginTop: '36px' }}>
                    <Button
                        key='submit'
                        type='sberPrimary'
                        htmlType="submit" 
                        loading={isLoading}
                        style={{ marginTop: '24px' }}
                    >
                        {RestorePasswordMsg}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}

const HeaderAction = (): React.ReactElement => {
    const intl = useIntl()
    const RegisterTitle = intl.formatMessage({ id: 'pages.auth.Register' })
    return (
        <Button
            key='submit'
            onClick={() => Router.push('/auth/register')}
            type='sberPrimary'
            secondary={true}
            size='large'
        >
            {RegisterTitle}
        </Button>
    )
}

ResetPage.headerAction = <HeaderAction />

ResetPage.container = AuthLayout

export default ResetPage
