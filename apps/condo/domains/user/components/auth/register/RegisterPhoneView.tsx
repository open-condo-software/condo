import React, { useCallback, useMemo, useState } from 'react'
import { Col, Form, Row, Typography } from 'antd'
import { FormattedMessage } from 'react-intl'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { SberIconWithoutLabel } from '@condo/domains/common/components/icons/SberIcon'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useConfirmIdentityContext } from '@condo/domains/user/components/auth/ConfirmIdentityContext'
import { START_CONFIRM_PHONE_MUTATION } from '@condo/domains/user/gql'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { FORM_LAYOUT } from '@condo/domains/user/constants/layout'
import { CAPTCHA_ACTIONS } from '@condo/domains/user/utils/captchaActions'
import { RegisterPageStep } from './RegisterPageStep'

export function RegisterPhoneView () {
    const intl = useIntl()

    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const RegisterHelpMessage = intl.formatMessage({ id: 'pages.auth.reset.RegisterHelp' })
    const UserAgreementFileName = intl.formatMessage({ id: 'pages.auth.register.info.UserAgreementFileName' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SMSTooManyRequestsError = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const SberIdRegisterMsg = intl.formatMessage({ id: 'SberIdRegister' })

    const [form] = Form.useForm()
    const { isSmall } = useLayoutContext()
    const { phone, token, isConfirmed, setToken, setPhone, setStep, handleReCaptchaVerify } = useConfirmIdentityContext()

    const [smsSendError, setSmsSendError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const [startPhoneVerify] = useMutation(START_CONFIRM_PHONE_MUTATION)

    const ErrorToFormFieldMsgMapping = useMemo(() => {
        return {
            [TOO_MANY_REQUESTS]: {
                name: 'phone',
                errors: [SMSTooManyRequestsError],
            },
        }
    }, [intl])

    const startConfirmPhone = useCallback(async () => {
        const { phone: inputPhone } = form.getFieldsValue(['phone'])
        const normalizedPhone = normalizePhone(inputPhone)

        if (phone === normalizedPhone && token && isConfirmed) {
            setStep(RegisterPageStep.FillCredentials)
            return
        }

        setPhone(normalizedPhone)
        const captcha = await handleReCaptchaVerify(CAPTCHA_ACTIONS.START_CONFIRM_PHONE)
        const registerExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        const variables = { data: { ...registerExtraData, phone: normalizedPhone, captcha } }
        setIsLoading(true)

        return runMutation({
            mutation: startPhoneVerify,
            variables,
            onCompleted: (data) => {
                const { data: { result: { token } } } = data
                setToken(token)
                setStep(RegisterPageStep.ConfirmPhone)
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(() => {
            setIsLoading(false)
        })
    }, [form, phone, token, isConfirmed, setPhone, handleReCaptchaVerify, startPhoneVerify, intl, ErrorToFormFieldMsgMapping, setStep, setToken])

    return (
        <Form
            {...FORM_LAYOUT}
            form={form}
            name='register-input-phone'
            onFinish={startConfirmPhone}
            colon={false}
            labelAlign='left'
            requiredMark={false}
        >
            <Row gutter={[0, 60]}>
                <Col span={24}>
                    <Row gutter={[0, 40]}>
                        <Col span={24}>
                            <Typography.Paragraph>{RegisterHelpMessage}</Typography.Paragraph>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name='phone'
                                label={PhoneMsg}
                                rules={[
                                    {
                                        required: true,
                                        message: FieldIsRequiredMsg,
                                    },
                                    () => ({
                                        validator () {
                                            if (!smsSendError) {
                                                return Promise.resolve()
                                            }
                                            return Promise.reject(smsSendError)
                                        },
                                    }),
                                ]}
                            >
                                <PhoneInput placeholder={ExamplePhoneMsg} onChange={() => setSmsSendError(null)} block />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <FormattedMessage
                                id='pages.auth.register.info.UserAgreement'
                                values={{
                                    link: (
                                        <Button type={'inlineLink'} size={'small'} target='_blank' href={'/policy.pdf'} rel='noreferrer'>
                                            {UserAgreementFileName}
                                        </Button>
                                    ),
                                }}
                            />
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Row justify={'space-between'} gutter={[0, 12]}>
                        <Col xs={24} lg={11}>
                            <Button
                                key='submit'
                                type='sberPrimary'
                                htmlType='submit'
                                loading={isLoading}
                                block={isSmall}
                            >
                                {RegisterMsg}
                            </Button>
                        </Col>
                        <Col xs={24} lg={11}>
                            <Button
                                key='submit'
                                type='sberAction'
                                icon={<SberIconWithoutLabel />}
                                href={'/api/sbbol/auth'}
                                block={isSmall}
                            >
                                {SberIdRegisterMsg}
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Form>
    )
}
