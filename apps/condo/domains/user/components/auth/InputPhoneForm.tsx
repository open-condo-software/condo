import { useStartConfirmPhoneActionMutation } from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { TabsAuthAction } from '@condo/domains/common/components/HeaderActions'
import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'

import { AgreementText } from './AgreementText'
import { useRegisterContext } from './RegisterContextProvider'


const { publicRuntimeConfig: { hasSbbolAuth, defaultLocale } } = getConfig()

type InputPhoneFormProps = {
    onFinish: () => void
}

const PHONE_INPUT_PROPS = { tabIndex: 1, autoFocus: true }
const TAB_INDEXES = { termsOfUse: 5, consentLink: 7, privacyPolicyLink: 6 }

export const InputPhoneForm: React.FC<InputPhoneFormProps> = ({ onFinish }) => {
    const intl = useIntl()

    const PhoneMessage = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const SMSTooManyRequestsErrorMessage = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    const WrongPhoneFormatErrorMessage = intl.formatMessage({ id: 'api.common.WRONG_PHONE_FORMAT' })
    const SubmitMessage = intl.formatMessage({ id: 'page.auth.register.inputPhone.submit' })

    const [form] = Form.useForm()

    const { executeCaptcha } = useHCaptcha()
    const { setToken, setPhone } = useRegisterContext()

    const router = useRouter()
    const { query: { next } } = router
    const redirectUrl = (next && !Array.isArray(next) && isSafeUrl(next)) ? next : '/'
    const { queryParams } = useAuthMethods()

    const [isLoading, setIsLoading] = useState(false)

    const registerPhoneRules = useMemo(
        () => [{ required: true, message: FieldIsRequiredMessage }],
        [FieldIsRequiredMessage]
    )

    const onError = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [TOO_MANY_REQUESTS]: 'phone',
        },
    })
    const [startConfirmPhoneAction] = useStartConfirmPhoneActionMutation({
        onError,
    })

    const startConfirmPhone = useCallback(async () => {
        if (isLoading) return

        const { phone: inputPhone } = form.getFieldsValue(['phone'])
        const phone = normalizePhone(inputPhone)
        if (!phone) {
            form.setFields([
                {
                    name: 'phone',
                    errors: [WrongPhoneFormatErrorMessage],
                },
            ])
            return
        }
        setPhone(phone)
        setIsLoading(true)

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const res = await startConfirmPhoneAction({
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
                setToken(token)
                await router.push(`/auth/register?token=${token}&${queryParams}`)
                onFinish()
                return
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
    }, [queryParams, isLoading, form, setPhone, WrongPhoneFormatErrorMessage, executeCaptcha, startConfirmPhoneAction, setToken, onFinish, SMSTooManyRequestsErrorMessage])

    return (
        <Row>
            <Col>
                <Row justify='center'>
                    <Col>
                        <TabsAuthAction currentActiveKey='register' />
                    </Col>
                </Row>
                <Form
                    form={form}
                    name='register-input-phone'
                    onFinish={startConfirmPhone}
                    requiredMark={false}
                    layout='vertical'
                >
                    <Row justify='start'>
                        <ResponsiveCol span={24}>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <FormItem
                                        name='phone'
                                        label={PhoneMessage}
                                        data-cy='register-phone-item'
                                        rules={registerPhoneRules}
                                    >
                                        <Input.Phone country={defaultLocale} placeholder={ExamplePhoneMessage} inputProps={PHONE_INPUT_PROPS} />
                                    </FormItem>
                                </Col>

                                <Col span={24}>
                                    <Row gutter={[0, 24]}>
                                        <Col span={24}>
                                            <Button
                                                key='submit'
                                                type='primary'
                                                htmlType='submit'
                                                loading={isLoading}
                                                data-cy='register-button'
                                                block
                                                tabIndex={2}
                                            >
                                                {SubmitMessage}
                                            </Button>
                                        </Col>
                                        {
                                            hasSbbolAuth && (
                                                <Col span={24} id='inputPhoneSBBOL'>
                                                    <LoginWithSBBOLButton
                                                        redirect={redirectUrl}
                                                        block
                                                        checkTlsCert
                                                        tabIndex={3}
                                                    />
                                                </Col>
                                            )
                                        }

                                        <AgreementText tabIndexes={TAB_INDEXES} />
                                    </Row>
                                </Col>
                            </Row>
                        </ResponsiveCol>
                    </Row>
                </Form>
            </Col>
        </Row>
    )
}
