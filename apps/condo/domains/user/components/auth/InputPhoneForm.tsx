import { Col, Form, Row, RowProps, Typography } from 'antd'
import getConfig from 'next/config'
import Router from 'next/router'
import React, { useCallback, useContext, useMemo, useState } from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { FormattedMessage } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { TabsAuthAction } from '@condo/domains/common/components/HeaderActions'
import { SberIconWithoutLabel } from '@condo/domains/common/components/icons/SberIcon'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { colors } from '@condo/domains/common/constants/style'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { START_CONFIRM_PHONE_MUTATION } from '@condo/domains/user/gql'



import { RegisterContext } from './RegisterContextProvider'


const ROW_STYLES: React.CSSProperties = {
    justifyContent: 'center',
}
const FORM_PARAGRAPH_STYLES: React.CSSProperties = {
    margin: '28px 0 40px',
    fontSize: '12px',
}
const FORM_TYPOGRAPHY_STYLES: React.CSSProperties = {
    textAlign:'center',
}
const FORM_PHONE_STYLES: React.CSSProperties = {
    borderRadius: 8,
    borderColor: colors.inputBorderGrey,
}
const FORM_BUTTONS_GUTTER: RowProps['gutter'] = [0, 20]

interface IInputPhoneFormProps {
    onFinish: () => void
}

export const InputPhoneForm: React.FC<IInputPhoneFormProps> = ({ onFinish }) => {
    const [form] = Form.useForm()
    const intl = useIntl()
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SMSTooManyRequestsError = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const LoginBySBBOLMsg = intl.formatMessage({ id: 'LoginBySBBOL' })
    const ConsentContent = intl.formatMessage({ id: 'pages.auth.register.info.ConsentContent' })
    const PrivacyPolicyContent = intl.formatMessage({ id: 'pages.auth.register.info.PrivacyPolicyContent' })

    const REGISTER_PHONE_LABEL = <label style={{ alignSelf: 'flex-end' }}>{PhoneMsg}</label>

    const { publicRuntimeConfig: { hasSbbolAuth } } = getConfig()

    const { setToken, setPhone, handleReCaptchaVerify } = useContext(RegisterContext)
    const [smsSendError, setSmsSendError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [startPhoneVerify] = useMutation(START_CONFIRM_PHONE_MUTATION)

    // TODO(DOMA-3293): remove this legacy error style and Useless error messages
    const ErrorToFormFieldMsgMapping = useMemo(() => {
        return {
            [TOO_MANY_REQUESTS]: {
                name: 'phone',
                errors: [SMSTooManyRequestsError],
            },
        }
    }, [intl])

    const PHONE_VALIDATOR = useCallback(() => ({
        validator () {
            if (!smsSendError) {
                return Promise.resolve()
            }
            return Promise.reject(smsSendError)
        },
    }), [smsSendError])

    const REGISTER_PHONE_RULES = useMemo(() => [
        { required: true, message: FieldIsRequiredMsg }, PHONE_VALIDATOR], [FieldIsRequiredMsg, PHONE_VALIDATOR])

    const startConfirmPhone = useCallback(async () => {
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
                Router.push(`/auth/register?token=${token}`)
                onFinish()
            },
            // Skip notification
            OnCompletedMsg: null,
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(() => {
            setIsLoading(false)
        })
    }, [intl, form, handleReCaptchaVerify])

    return (
        <Row justify='center'>
            <Col span={16}>
                <TabsAuthAction currentActiveKey='/auth/register'/>
            </Col>
            <Col span={24}>
                <Form
                    form={form}
                    name='register-input-phone'
                    onFinish={startConfirmPhone}
                    requiredMark={false}
                    layout='vertical'
                >
                    <Row style={ROW_STYLES}>
                        <ResponsiveCol span={24}>
                            <Row>
                                <Col span={24}>
                                    <Form.Item
                                        name='phone'
                                        label={REGISTER_PHONE_LABEL}
                                        data-cy='register-phone-item'
                                        rules={REGISTER_PHONE_RULES}
                                    >
                                        <PhoneInput
                                            style={FORM_PHONE_STYLES}
                                            placeholder={ExamplePhoneMsg}
                                            onChange={() => setSmsSendError(null)}
                                            block
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Typography.Paragraph type='secondary' style={FORM_PARAGRAPH_STYLES}>
                                        <FormattedMessage
                                            id='pages.auth.register.info.PersonalDataProcessingConsent'
                                            values={{
                                                consentLink: (
                                                    <Typography.Link
                                                        style={{ color: colors.black }}
                                                        target='_blank'
                                                        href='/pdpc.pdf'
                                                        rel='noreferrer'>
                                                        {ConsentContent}
                                                    </Typography.Link>
                                                ),
                                                privacyPolicyLink: (
                                                    <Typography.Link
                                                        style={{ color: colors.black }}
                                                        target='_blank'
                                                        href='/policy.pdf'
                                                        rel='noreferrer'>
                                                        {PrivacyPolicyContent}
                                                    </Typography.Link>
                                                ),
                                            }}
                                        />
                                    </Typography.Paragraph>
                                </Col>
                            </Row>
                            <Row gutter={FORM_BUTTONS_GUTTER}>
                                <Col span={24}>
                                    <Form.Item>
                                        <Button
                                            key='submit'
                                            type='sberDefaultGradient'
                                            htmlType='submit'
                                            loading={isLoading}
                                            data-cy='register-button'
                                            block
                                        >
                                            {RegisterMsg}
                                        </Button>
                                    </Form.Item>
                                </Col>
                                {(hasSbbolAuth) ?
                                    <>
                                        <Col span={24} style={FORM_TYPOGRAPHY_STYLES}>
                                            <FormattedMessage id='Or'/>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item>
                                                <Button
                                                    key='submit'
                                                    type='sberAction'
                                                    secondary
                                                    icon={<SberIconWithoutLabel/>}
                                                    href='/api/sbbol/auth'
                                                    block
                                                >
                                                    {LoginBySBBOLMsg}
                                                </Button>
                                            </Form.Item>
                                        </Col>
                                    </>
                                    : null
                                }
                            </Row>
                        </ResponsiveCol>
                    </Row>
                </Form>
            </Col>
        </Row>
    )
}