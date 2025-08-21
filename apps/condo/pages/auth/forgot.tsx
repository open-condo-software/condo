import { useStartConfirmPhoneActionMutation, useStartConfirmEmailActionMutation } from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { ArrowLeft } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input, Space, Typography } from '@open-condo/ui'

import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PageComponentType } from '@condo/domains/common/types'
import {
    RegisterContextProvider,
    useRegisterContext,
} from '@condo/domains/user/components/auth/RegisterContextProvider'
import { ValidateIdentifierForm } from '@condo/domains/user/components/auth/ValidateIdentifierForm'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { SMS_CODE_TTL, EMAIL_CODE_TTL } from '@condo/domains/user/constants/common'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'
import { normalizeUserIdentifier } from '@condo/domains/user/utils/helpers'

import type { FetchResult } from '@apollo/client/link/core'
import type { StartConfirmEmailActionMutation, StartConfirmPhoneActionMutation } from '@app/condo/gql'


const { publicRuntimeConfig: { defaultLocale } } = getConfig()

type StepType = 'inputIdentifier' | 'validateIdentifier'

const INITIAL_VALUES = { identifier: '' }

function ResetPageView () {
    const intl = useIntl()
    const RestorePasswordMessage = intl.formatMessage({ id: 'pages.auth.reset.ResetPasswordTitle' })
    const ResetTitleMessage = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const InstructionsPhoneMessage = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp.phone' })
    const InstructionsEmailMessage = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp.email' })
    const InstructionsPhoneOrEmailMessage = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp.phoneOrEmail' })
    const PhoneMessage = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const EmailMessage = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const PhoneOrEmailMessage = intl.formatMessage({ id: 'pages.auth.register.field.PhoneOrEmail' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const TooManyRequestsErrorMessage = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })

    const { queryParams, authMethods } = useAuthMethods()

    const InstructionsMessage = authMethods.phonePassword && authMethods.emailPassword
        ? InstructionsPhoneOrEmailMessage
        : authMethods.emailPassword && !authMethods.phonePassword
            ? InstructionsEmailMessage
            : InstructionsPhoneMessage

    const router = useRouter()

    const [form] = Form.useForm()
    const { executeCaptcha } = useHCaptcha()
    const { token, setToken, setIdentifier } = useRegisterContext()

    const { organization } = useOrganization()
    const country = organization?.country || defaultLocale

    const [step, setStep] = useState<StepType>('inputIdentifier')
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const onError = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [TOO_MANY_REQUESTS]: 'identifier',
        },
    })
    const [startConfirmPhoneActionMutation] = useStartConfirmPhoneActionMutation({
        onError,
    })
    const [startConfirmEmailActionMutation] = useStartConfirmEmailActionMutation({
        onError,
    })

    const { requiredValidator, phoneOrEmailValidator, phoneValidator, emailValidator } = useValidations()
    const validations = useMemo(() => {
        const rules = [requiredValidator]
        if (authMethods.phonePassword && authMethods.emailPassword) {
            rules.push(phoneOrEmailValidator)
        } else if (authMethods.emailPassword && !authMethods.phonePassword) {
            rules.push(emailValidator)
        } else {
            rules.push(phoneValidator)
        }

        return {
            identifier: rules,
        }
    }, [requiredValidator, authMethods, phoneOrEmailValidator, emailValidator, phoneValidator])

    const startConfirmPhone = useCallback(async () => {
        if (isLoading) return

        const { identifier: inputIdentifier } = form.getFieldsValue(['identifier'])
        const identifier = normalizeUserIdentifier(inputIdentifier)

        if (!identifier.type || !identifier.normalizedValue) return

        setIsLoading(true)

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const commonPayload = {
                dv: 1,
                sender,
                captcha,
            }

            let res: FetchResult<StartConfirmEmailActionMutation> | FetchResult<StartConfirmPhoneActionMutation>
            if (identifier.type === 'email') {
                res = await startConfirmEmailActionMutation({
                    variables: {
                        data: {
                            ...commonPayload,
                            email: identifier.normalizedValue,
                        },
                    },
                })
            } else {
                res = await startConfirmPhoneActionMutation({
                    variables: {
                        data: {
                            ...commonPayload,
                            phone: identifier.normalizedValue,
                        },
                    },
                })
            }

            const token = res?.data?.result?.token
            if (!res.errors && token) {
                setIdentifier(identifier.normalizedValue)
                setToken(token)
                setStep('validateIdentifier')
            }
        } catch (error) {
            console.error('Start confirm action failed')
            console.error(error)
            form.setFields([
                {
                    name: 'identifier',
                    // NOTE(pahaz): `friendlyDescription` is the last GQLError.messageForUser!
                    errors: [(error.friendlyDescription) ? error.friendlyDescription : TooManyRequestsErrorMessage],
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }, [TooManyRequestsErrorMessage, executeCaptcha, form, isLoading, setIdentifier, setToken, startConfirmEmailActionMutation, startConfirmPhoneActionMutation])

    const onReset = useCallback(() => {
        router.back()
    }, [])

    if (step === 'validateIdentifier') {
        return (
            <ValidateIdentifierForm
                onFinish={() => router.push(`/auth/change-password?token=${token}&${queryParams}`)}
                onReset={() => setStep('inputIdentifier')}
                title={ResetTitleMessage}
            />
        )
    }

    return (
        <>
            <Head>
                <title>{ResetTitleMessage}</title>
            </Head>
            <Form
                form={form}
                name='forgot-password'
                validateTrigger={['onBlur', 'onSubmit']}
                initialValues={INITIAL_VALUES}
                colon={false}
                requiredMark={false}
                layout='vertical'
            >
                <Row justify='center'>
                    <ResponsiveCol span={24}>
                        <Row gutter={[0, 40]} justify='center'>
                            <Col span={24}>
                                <Row gutter={[0, 16]}>
                                    <Col span={24}>
                                        <Space direction='vertical' size={24}>
                                            <Button.Icon onClick={onReset} size='small'>
                                                <ArrowLeft />
                                            </Button.Icon>
                                            <Typography.Title level={2}>{ResetTitleMessage}</Typography.Title>
                                        </Space>
                                    </Col>

                                    <Col span={24}>
                                        <Typography.Text type='secondary'>
                                            {InstructionsMessage}
                                        </Typography.Text>
                                    </Col>

                                    <Col span={24}>
                                        {
                                            authMethods.phonePassword && !authMethods.emailPassword && (
                                                <FormItem
                                                    name='identifier'
                                                    label={PhoneMessage}
                                                    rules={validations.identifier}
                                                    data-cy='forgot-identifier-item'
                                                >
                                                    <Input.Phone country={country} placeholder={ExamplePhoneMessage}/>
                                                </FormItem>
                                            )
                                        }
                                        {
                                            !authMethods.phonePassword && authMethods.emailPassword && (
                                                <FormItem
                                                    name='identifier'
                                                    label={EmailMessage}
                                                    rules={validations.identifier}
                                                    data-cy='forgot-identifier-item'
                                                >
                                                    <Input placeholder={ExampleEmailMessage} />
                                                </FormItem>
                                            )
                                        }
                                        {
                                            authMethods.phonePassword && authMethods.emailPassword && (
                                                <FormItem
                                                    name='identifier'
                                                    label={PhoneOrEmailMessage}
                                                    rules={validations.identifier}
                                                    data-cy='forgot-identifier-item'
                                                >
                                                    <Input />
                                                </FormItem>
                                            )
                                        }
                                    </Col>
                                </Row>
                            </Col>

                            <Col span={24}>
                                <CountDownTimer
                                    action={startConfirmPhone}
                                    id='FORGOT_ACTION'
                                    timeout={Math.max(SMS_CODE_TTL, EMAIL_CODE_TTL)}
                                >
                                    {({ countdown, runAction }) => {
                                        const isCountDownActive = countdown > 0

                                        return (
                                            <Button
                                                onClick={() => {
                                                    form.validateFields().then(() => {
                                                        runAction()
                                                    }).catch(_ => {
                                                        // validation check failed - don't invoke runAction
                                                    })
                                                }}
                                                type='primary'
                                                disabled={isCountDownActive}
                                                loading={isLoading}
                                                htmlType='submit'
                                                block
                                                data-cy='forgot-button'
                                            >
                                                {isCountDownActive ? `${RestorePasswordMessage} ${countdown}` : RestorePasswordMessage}
                                            </Button>
                                        )
                                    }}
                                </CountDownTimer>
                            </Col>
                        </Row>
                    </ResponsiveCol>
                </Row>
            </Form>
        </>
    )
}

const ResetPage: PageComponentType = () => {
    return (
        <RegisterContextProvider><ResetPageView/></RegisterContextProvider>
    )
}

ResetPage.container = AuthLayout
ResetPage.skipUserPrefetch = true

export default ResetPage
