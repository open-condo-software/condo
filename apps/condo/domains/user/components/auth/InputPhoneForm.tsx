import { Col, Form, Row, RowProps } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useMemo, useState } from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { FormattedMessage } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { TabsAuthAction } from '@condo/domains/common/components/HeaderActions'
import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { colors } from '@condo/domains/common/constants/style'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { START_CONFIRM_PHONE_MUTATION } from '@condo/domains/user/gql'

import { AgreementText } from './AgreementText'
import { RegisterContext } from './RegisterContextProvider'


const ROW_STYLES: React.CSSProperties = {
    justifyContent: 'center',
}
const FORM_TYPOGRAPHY_STYLES: React.CSSProperties = {
    textAlign: 'center',
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
    const SMSTooManyRequestsErrorMsg = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    const WrongPhoneFormatErrorMsg = intl.formatMessage({ id: 'api.common.WRONG_PHONE_FORMAT' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })

    const REGISTER_PHONE_LABEL = <label style={{ alignSelf: 'flex-end' }}>{PhoneMsg}</label>

    const { publicRuntimeConfig: { hasSbbolAuth } } = getConfig()

    const router = useRouter()
    const { query: { next } } = router
    const redirectUrl = (next && !Array.isArray(next) && isSafeUrl(next)) ? next : '/'
    const { setToken, setPhone, handleCaptchaVerify } = useContext(RegisterContext)
    const [isLoading, setIsLoading] = useState(false)
    const [startPhoneVerify] = useMutation(START_CONFIRM_PHONE_MUTATION)

    // TODO(DOMA-3293): remove this legacy error style and Useless error messages
    const ErrorToFormFieldMsgMapping = useMemo(() => {
        return {
            [TOO_MANY_REQUESTS]: {
                name: 'phone',
                errors: [SMSTooManyRequestsErrorMsg],
            },
        }
    }, [intl])

    const REGISTER_PHONE_RULES = useMemo(
        () => [{ required: true, message: FieldIsRequiredMsg }],
        [FieldIsRequiredMsg]
    )

    const startConfirmPhone = useCallback(async (...args) => {
        const registerExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        const { phone: inputPhone } = form.getFieldsValue(['phone'])
        const phone = normalizePhone(inputPhone)
        if (!phone) {
            form.setFields([
                {
                    name: 'phone',
                    errors: [WrongPhoneFormatErrorMsg],
                },
            ])
            return
        }

        setPhone(phone)
        const captcha = await handleCaptchaVerify()
        const variables = { data: { ...registerExtraData, phone, captcha } }
        setIsLoading(true)

        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: startPhoneVerify,
            variables,
            onError: (error) => {
                form.setFields([
                    {
                        name: 'phone',
                        // NOTE(pahaz): `friendlyDescription` is the last GQLError.messageForUser!
                        errors: [(error.friendlyDescription) ? error.friendlyDescription : SMSTooManyRequestsErrorMsg],
                    },
                ])
            },
            onCompleted: (data) => {
                const { data: { result: { token } } } = data
                setToken(token)
                router.push(`/auth/register?token=${token}`)
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
        })
    }, [intl, form, handleCaptchaVerify, WrongPhoneFormatErrorMsg, setPhone, setIsLoading, onFinish])

    return (
        <Row justify='center'>
            <Col span={16}>
                <TabsAuthAction currentActiveKey='register' />
            </Col>
            <Col span={24}>
                <Form
                    form={form}
                    name='register-input-phone'
                    onFinish={startConfirmPhone}
                    requiredMark={false}
                    layout='vertical'
                >
                    <Row style={ROW_STYLES} gutter={[0, 28]}>
                        <ResponsiveCol span={24}>
                            <Row gutter={[0, 28]}>
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
                                            block
                                        />
                                    </Form.Item>
                                </Col>

                                <AgreementText />
                            </Row>
                        </ResponsiveCol>
                        <ResponsiveCol span={24}>
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
                                            <Form.Item id='inputPhoneSBBOL'>
                                                <LoginWithSBBOLButton redirect={redirectUrl} block checkTlsCert />
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
