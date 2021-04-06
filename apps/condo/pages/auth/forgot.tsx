// @ts-nocheck
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { useState } from 'react'
import { Button, Form, Input, Result, Typography, Alert, Row, Col } from 'antd'
import Head from 'next/head'
import Router from 'next/router'
import { useIntl } from '@core/next/intl'
import gql from 'graphql-tag'
import { useMutation } from '@core/next/apollo'

import { TopMenuOnlyLayout } from '@condo/domains/common/components/containers/BaseLayout'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'

const START_PASSWORD_RECOVERY_MUTATION = gql`
    mutation startPasswordRecovery($email: String!){
        status: startPasswordRecovery(email: $email)
    }
`

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
    const ErrorToFormFieldMsgMapping = {
        '[unknown-user]': {
            name: 'email',
            errors: [EmailIsNotRegisteredMsg],
        },
    }

    const onFinish = values => {
        if (values.email) values.email = values.email.toLowerCase()
        setIsLoading(true)
        return runMutation({
            mutation: startPasswordRecovery,
            variables: values,
            onCompleted: () => setIsSuccessMessage(true),
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
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
            form={form}
            name="forgot"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            <Row gutter={[0, 24]} >
                <Col span={24}>
                    <Alert
                        message=""
                        description={ForgotPasswordDescriptionMsg}
                        type="info"
                    ></Alert>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label={EmailMsg}
                        name="email"
                        rules={[{ required: true, message: PleaseInputYourEmailMsg }]}
                        placeholder="name@example.com"
                    >
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item style={{ textAlign: 'center' }}>
                        <Button type="primary" htmlType="submit" loading={isLoading}>
                            {StartRecoveryMsg}
                        </Button>
                        <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/register')}>
                            {RegisterMsg}
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
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
        <Typography.Title css={css`text-align: center;`} level={2}>{ForgotPasswordTitleMsg}</Typography.Title>
        <ForgotForm />
    </>)
}

ForgotPage.container = TopMenuOnlyLayout
export default ForgotPage
