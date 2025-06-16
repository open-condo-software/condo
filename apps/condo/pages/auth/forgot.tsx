import { useStartConfirmPhoneActionMutation } from '@app/condo/gql'
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
import { normalizePhone } from '@condo/domains/common/utils/phone'
import {
    RegisterContextProvider,
    useRegisterContext,
} from '@condo/domains/user/components/auth/RegisterContextProvider'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { SMS_CODE_TTL } from '@condo/domains/user/constants/common'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'


const { publicRuntimeConfig: { defaultLocale } } = getConfig()

type StepType = 'inputPhone' | 'validatePhone'

const INITIAL_VALUES = { email: '' }

function ResetPageView () {
    const intl = useIntl()
    const RestorePasswordMessage = intl.formatMessage({ id: 'pages.auth.reset.ResetPasswordTitle' })
    const ResetTitleMessage = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const InstructionsMessage = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp' })
    const PhoneMessage = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const SMSTooManyRequestsErrorMessage = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })

    const router = useRouter()
    const { queryParams } = useAuthMethods()

    const [form] = Form.useForm()
    const { executeCaptcha } = useHCaptcha()
    const { token, setToken, setPhone } = useRegisterContext()

    const { organization } = useOrganization()
    const country = organization?.country || defaultLocale

    const [step, setStep] = useState<StepType>('inputPhone')
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const onError = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [TOO_MANY_REQUESTS]: 'phone',
        },
    })
    const [startConfirmPhoneActionMutation] = useStartConfirmPhoneActionMutation({
        onError,
    })

    const { requiredValidator, phoneValidator } = useValidations()
    const validations = useMemo(() => ({
        phone: [requiredValidator, phoneValidator],
    }), [requiredValidator, phoneValidator])

    const startConfirmPhone = useCallback(async () => {
        if (isLoading) return

        setIsLoading(true)

        const { phone: inputPhone } = form.getFieldsValue(['phone'])
        const phone = normalizePhone(inputPhone)

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const res = await startConfirmPhoneActionMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        phone,
                    },
                },
            })

            const token = res?.data?.result?.token
            if (!res.errors && token) {
                setPhone(phone)
                setToken(token)
                setStep('validatePhone')
            }
        } catch (error) {
            console.error('Start confirm phone action failed')
            console.error(error)
            form.setFields([
                {
                    name: 'phone',
                    // NOTE(pahaz): `friendlyDescription` is the last GQLError.messageForUser!
                    errors: [(error.friendlyDescription) ? error.friendlyDescription : SMSTooManyRequestsErrorMessage],
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }, [SMSTooManyRequestsErrorMessage, executeCaptcha, form, isLoading, setPhone, setToken, startConfirmPhoneActionMutation])

    const onReset = useCallback(() => {
        router.back()
    }, [])

    if (step === 'validatePhone') {
        return (
            <ValidatePhoneForm
                onFinish={() => router.push(`/auth/change-password?token=${token}&${queryParams}`)}
                onReset={() => setStep('inputPhone')}
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
                                        <FormItem
                                            name='phone'
                                            label={PhoneMessage}
                                            rules={validations.phone}
                                            data-cy='forgot-phone-item'
                                        >
                                            <Input.Phone country={country} placeholder={ExamplePhoneMessage}/>
                                        </FormItem>
                                    </Col>
                                </Row>
                            </Col>

                            <Col span={24}>
                                <CountDownTimer
                                    action={startConfirmPhone}
                                    id='FORGOT_ACTION'
                                    timeout={SMS_CODE_TTL}
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
