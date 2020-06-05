/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { useState } from 'react'
import { Button, Form, Input, notification, Typography, Result } from 'antd'
import Head from 'next/head'
import Router from 'next/router'
import { useIntl } from '@core/next/intl'
import gql from 'graphql-tag'
import { useMutation } from '@core/next/apollo'

import BaseLayout from '../../containers/BaseLayout'
import { getQueryParams } from '../../utils/url.utils'

const { Title, Paragraph } = Typography

const START_PASSWORD_RECOVERY_MUTATION = gql`
    mutation startPasswordRecovery($email: String!){
        status: startPasswordRecovery(email: $email)
    }
`

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
}

const ForgotForm = () => {
    const [form] = Form.useForm()
    const intl = useIntl()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccessMessage, setIsSuccessMessage] = useState(false)
    const [startPasswordRecovery, ctx] = useMutation(START_PASSWORD_RECOVERY_MUTATION)
    let initialValues = getQueryParams()
    initialValues = { ...initialValues, password: '', confirm: '' }

    const StartRecoveryMsg = intl.formatMessage({ id: 'StartRecovery' })
    const EmailMsg = intl.formatMessage({ id: 'Email' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const StartedMsg = intl.formatMessage({ id: 'Started' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const PleaseInputYourEmailMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourEmail' })
    const EmailIsNotRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotRegistered' })
    const ForgotPasswordDescriptionMsg = intl.formatMessage({ id: 'pages.auth.ForgotPasswordDescription' })
    const ForgotPasswordStartedDescriptionMsg = intl.formatMessage({ id: 'pages.auth.ForgotPasswordStartedDescription' })

    const onFinish = values => {
        if (values.email) values.email = values.email.toLowerCase()
        setIsLoading(true)
        startPasswordRecovery({ variables: values })
            .then(
                (data) => {
                    notification.success({ message: StartedMsg })
                    setIsSuccessMessage(true)
                },
                (e) => {
                    console.log(e)
                    const errors = []
                    notification.error({
                        message: ServerErrorMsg,
                        description: e.message,
                    })
                    if (e.message.includes('[unknown-user]')) {
                        errors.push({
                            name: 'email',
                            errors: [EmailIsNotRegisteredMsg],
                        })
                    }
                    if (errors.length) {
                        form.setFields(errors)
                    }
                })
            .finally(() => {
                setIsLoading(false)
            })
    }

    if (isSuccessMessage) {
        return <Result
            status="success"
            title={StartedMsg}
            subTitle={ForgotPasswordStartedDescriptionMsg}
        />
    }

    return (
        <Form
            {...layout}
            form={form}
            name="forgot"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            <Paragraph css={css`text-align: center;`}>{ForgotPasswordDescriptionMsg}</Paragraph>
            <Form.Item
                label={EmailMsg}
                name="email"
                rules={[{ required: true, message: PleaseInputYourEmailMsg }]}
                placeholder="name@example.com"
            >
                <Input/>
            </Form.Item>

            <Form.Item {...tailLayout}>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    {StartRecoveryMsg}
                </Button>
                <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/register')}>
                    {RegisterMsg}
                </Button>
            </Form.Item>
        </Form>
    )
}

const ForgotPage = () => {
    const intl = useIntl()
    const ForgotPasswordTitleMsg = intl.formatMessage({ id: 'pages.auth.ForgotPasswordTitle' })
    return (<>
        <Head>
            <title>{ForgotPasswordTitleMsg}</title>
        </Head>
        <Title css={css`text-align: center;`} level={2}>{ForgotPasswordTitleMsg}</Title>
        <ForgotForm/>
    </>)
}

function CustomContainer (props) {
    return (<BaseLayout
        {...props}
        logoLocation="topMenu"
        className="top-menu-only-layout"
    />)
}

ForgotPage.container = CustomContainer

export default ForgotPage
