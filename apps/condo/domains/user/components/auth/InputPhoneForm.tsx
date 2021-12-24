import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { START_CONFIRM_PHONE_MUTATION } from '@condo/domains/user/gql'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Col, Form, Row, Typography } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import {  useRegisterContext } from './RegisterContextProvider'
import { SberIconWithoutLabel } from '@condo/domains/common/components/icons/SberIcon'
import { useRouter } from 'next/router'


const FORM_LAYOUT = {
    labelCol: { span: 10 },
    wrapperCol: { span: 14 },
}

interface IInputPhoneFormProps {
    onFinish?: () => void
}

export const InputPhoneForm: React.FC<IInputPhoneFormProps> = ({ onFinish }) => {
    const intl = useIntl()
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const RegisterHelpMessage = intl.formatMessage({ id: 'pages.auth.reset.RegisterHelp' })
    const UserAgreementFileName = intl.formatMessage({ id: 'pages.auth.register.info.UserAgreementFileName' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SMSTooManyRequestsError = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const SberIdRegisterMsg = intl.formatMessage({ id: 'SberIdRegister' })

    const router = useRouter()
    const [form] = Form.useForm()

    const { isSmall } = useLayoutContext()
    const { token, isConfirmed, setToken, setPhone, handleReCaptchaVerify } = useRegisterContext()
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
        console.log(token, isConfirmed)
        if (token && isConfirmed) {
            router.push(`/auth/confirm?token=${token}`)
            return
        }
        const registerExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        const { phone: inputPhone } = form.getFieldsValue(['phone'])
        const phone = normalizePhone(inputPhone)
        setPhone(phone)
        const captcha = await handleReCaptchaVerify('start_confirm_phone')
        const variables = { data: { ...registerExtraData, phone, captcha } }
        setIsLoading(true)

        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: startPhoneVerify,
            variables,
            onCompleted: (data) => {
                const { data: { result: { token } } } = data
                setToken(token)
                router.push(`/auth/confirm?token=${token}`)
                if (onFinish) {
                    onFinish()
                }
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
    }, [token, isConfirmed, form, setPhone, handleReCaptchaVerify, startPhoneVerify, intl, ErrorToFormFieldMsgMapping, router, setToken, onFinish])

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