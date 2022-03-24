import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { START_CONFIRM_PHONE_MUTATION } from '@condo/domains/user/gql'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Col, Form, Row, Space, Checkbox, Typography } from 'antd'
import Router from 'next/router'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { RegisterContext } from './RegisterContextProvider'
import { SberIconWithoutLabel } from '@condo/domains/common/components/icons/SberIcon'
import { colors } from '@condo/domains/common/constants/style'


const FORM_LAYOUT = {
    labelCol: { span: 10 },
    wrapperCol: { span: 14 },
}

interface IInputPhoneFormProps {
    onFinish: () => void
}

export const InputPhoneForm: React.FC<IInputPhoneFormProps> = ({ onFinish })=> {
    const [form] = Form.useForm()
    const intl = useIntl()
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const RegisterHelpMessage = intl.formatMessage({ id: 'pages.auth.reset.RegisterHelp' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SMSTooManyRequestsError = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const SberIdRegisterMsg = intl.formatMessage({ id: 'SberIdRegister' })

    const ConsentContent = intl.formatMessage({ id: 'pages.auth.register.info.ConsentContent' })
    const PrivacyPolicyContent = intl.formatMessage({ id: 'pages.auth.register.info.PrivacyPolicyContent' })

    const { isSmall } = useLayoutContext()
    const { setToken, setPhone, handleReCaptchaVerify } = useContext(RegisterContext)
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

    const [agreed, setAgreed] = useState(false)
    const handleToggleAgreed = useCallback(() => {
        setAgreed(prevState => !prevState)
    }, [setAgreed])

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
            <Space direction={'vertical'} align={'center'} size={20}>
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
                    <PhoneInput placeholder={ExamplePhoneMsg} onChange={() => setSmsSendError(null)} block/>
                </Form.Item>
                <Checkbox checked={agreed} onChange={handleToggleAgreed}>
                    <FormattedMessage
                        id='pages.auth.register.info.PersonalDataProcessingConsent'
                        values={{
                            consentLink: (
                                <Button style={{ bottom: '-4px' }} type={'inlineLink'} size={'small'} target='_blank' href={'/pdpc.pdf'} rel='noreferrer'>{ConsentContent}</Button>
                            ),
                            privacyPolicyLink: (
                                <Button style={{ bottom: '-4px' }} type={'inlineLink'} size={'small'} target='_blank' href={'/policy.pdf'} rel='noreferrer'>{PrivacyPolicyContent}</Button>
                            ),
                        }}
                    />
                </Checkbox>
                <Space direction={'vertical'} align={'center'} size={20}>
                    <Button
                        key='submit'
                        type='sberPrimary'
                        htmlType='submit'
                        loading={isLoading}
                        block={isSmall}
                        disabled={!agreed}
                    >
                        {RegisterMsg}
                    </Button>
                    <Typography.Text disabled style={ { color: colors.textSecondary, fontWeight: 600 } }>или</Typography.Text>
                    <Button
                        key='submit'
                        type='sberAction'
                        icon={<SberIconWithoutLabel/>}
                        href={'/api/sbbol/auth'}
                        block={isSmall}
                        disabled={!agreed}
                    >
                        {SberIdRegisterMsg}
                    </Button>
                </Space>
            </Space>
        </Form>
    )
}