import { Form, Typography, Row, Col } from 'antd'
import { Button } from '@condo/domains/common/components/Button'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import Router from 'next/router'
import React, { useState } from 'react'
import { colors } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'
import { FormattedMessage } from 'react-intl'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { START_PASSWORD_RECOVERY_MUTATION } from '@condo/domains/user/gql'
import { WRONG_PHONE_ERROR } from '@condo/domains/user/constants/errors'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { LOCK_TIMEOUT } from '@condo/domains/user/constants/common'
import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { FORM_LAYOUT } from '@condo/domains/user/constants/layout'
// import { useConfirmIdentityContext } from '@condo/domains/user/components/auth/ConfirmIdentityContext'

const LINK_STYLE = { color: colors.sberPrimary[7] }


export const ResetPasswordPhoneView = () => {
    const [form] = Form.useForm()
    const initialValues = { email: '' }
    const intl = useIntl()
    const RestorePasswordMsg = intl.formatMessage({ id: 'pages.auth.reset.RestorePasswordTitle' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const InstructionsMsg = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp' })
    const PhoneIsNotRegisteredMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsNotRegistered' })
    const CheckPhoneMsg = intl.formatMessage({ id: 'pages.auth.reset.CheckPhone' })
    const ReturnToLoginPage = intl.formatMessage({ id: 'pages.auth.reset.ReturnToLoginPage' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })

    // const { setStep } = useRegisterContext()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccessMessage, setIsSuccessMessage] = useState(false)
    const [startPasswordRecovery] = useMutation(START_PASSWORD_RECOVERY_MUTATION)

    const ErrorToFormFieldMsgMapping = {
        [WRONG_PHONE_ERROR]: {
            name: 'phone',
            errors: [PhoneIsNotRegisteredMsg],
        },
    }

    const { requiredValidator, phoneValidator } = useValidations()
    const validations = {
        phone: [requiredValidator, phoneValidator],
    }

    if (isLoading) {
        return <LoadingOrErrorPage title={ResetTitle} loading={isLoading} error={null} />
    }
    if (isSuccessMessage) {
        return (
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Typography.Title>{CheckPhoneMsg}</Typography.Title>
                </Col>
                <Col span={24}>
                    <Typography.Paragraph>
                        <FormattedMessage id='pages.auth.reset.ResetSuccessMessage' values={{ phone: form.getFieldValue('phone') }} />
                    </Typography.Paragraph>
                </Col>
                <Col span={24}>
                    <Typography.Paragraph>
                        <a style={LINK_STYLE} onClick={() => Router.push('/auth/signin')}>{ReturnToLoginPage}</a>
                    </Typography.Paragraph>
                </Col>
            </Row>
        )
    }

    const forgotAction = async () => {
        setIsLoading(true)
        const sender = getClientSideSenderInfo()
        const dv = 1
        const values = { ...form.getFieldsValue(['phone']), dv, sender }
        return runMutation({
            mutation: startPasswordRecovery,
            variables: { data: values },
            onCompleted: () => {
                setIsLoading(false)
                setIsSuccessMessage(true)
            },
            finally: () => setIsLoading(false),
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(err => {
            console.error(err)
            setIsLoading(false)
        })
    }

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <Typography.Title style={{ textAlign: 'left' }}>{ResetTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <Typography.Paragraph style={{ textAlign: 'left' }}>{InstructionsMsg}</Typography.Paragraph>
            </Col>
            <Col span={24}>
                <Form
                    {...FORM_LAYOUT}
                    form={form}
                    name='forgot-password'
                    validateTrigger={['onBlur', 'onSubmit']}
                    initialValues={initialValues}
                    colon={false}
                    labelAlign='left'
                    requiredMark={false}
                >
                    <Row gutter={[0, 60]}>
                        <Col span={24}>
                            <Form.Item
                                name='phone'
                                label={PhoneMsg}
                                rules={validations.phone}
                            >
                                <PhoneInput placeholder={ExamplePhoneMsg} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item>
                                <CountDownTimer action={forgotAction} id={'FORGOT_ACTION'} timeout={LOCK_TIMEOUT}>
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
                                                type={isCountDownActive ? 'sberGrey' : 'sberPrimary'}
                                                disabled={isCountDownActive}
                                                loading={isLoading}
                                                htmlType='submit'
                                            >
                                                {isCountDownActive ? `${RestorePasswordMsg} ${countdown}` : RestorePasswordMsg}
                                            </Button>
                                        )
                                    }}
                                </CountDownTimer>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Col>
        </Row>
    )
}

