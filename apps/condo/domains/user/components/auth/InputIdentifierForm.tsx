import { useStartConfirmPhoneActionMutation, useStartConfirmEmailActionMutation } from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { TabsAuthAction } from '@condo/domains/common/components/HeaderActions'
import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { TOO_MANY_REQUESTS } from '@condo/domains/user/constants/errors'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'
import { normalizeUserIdentifier } from '@condo/domains/user/utils/helpers'

import { AgreementText } from './AgreementText'
import { useRegisterContext } from './RegisterContextProvider'

import type { FetchResult } from '@apollo/client/link/core'
import type { StartConfirmEmailActionMutation, StartConfirmPhoneActionMutation } from '@app/condo/gql'


const { publicRuntimeConfig: { hasSbbolAuth, defaultLocale } } = getConfig()

type InputIdentifierFormProps = {
    onFinish: () => void
}

const IDENTIFIER_INPUT_PROPS = { tabIndex: 1, autoFocus: true }
const TAB_INDEXES = { termsOfUse: 5, consentLink: 7, privacyPolicyLink: 6 }

export const InputIdentifierForm: React.FC<InputIdentifierFormProps> = ({ onFinish }) => {
    const intl = useIntl()

    const PhoneMessage = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const EmailMessage = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const PhoneOrEmailMessage = intl.formatMessage({ id: 'pages.auth.register.field.PhoneOrEmail' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const TooManyRequestsErrorMessage = intl.formatMessage({ id: 'pages.auth.TooManyRequests' })
    const WrongPhoneFormatErrorMessage = intl.formatMessage({ id: 'api.common.WRONG_PHONE_FORMAT' })
    const WrongEmailFormatErrorMessage = intl.formatMessage({ id: 'api.common.INVALID_EMAIL_FORMAT' })
    const WrongPhoneOrEmailFormatErrorMessage = intl.formatMessage({ id: 'common.errors.WRONG_PHONE_OR_EMAIL_FORMAT' })
    const SubmitMessage = intl.formatMessage({ id: 'page.auth.register.inputIdentifier.submit' })

    const { queryParams, authMethods } = useAuthMethods()

    const WrongIdentifierFormatErrorMessage = authMethods.emailPassword && authMethods.phonePassword
        ? WrongPhoneOrEmailFormatErrorMessage
        : authMethods.emailPassword
            ? WrongEmailFormatErrorMessage
            : WrongPhoneFormatErrorMessage

    const [form] = Form.useForm()

    const { executeCaptcha } = useHCaptcha()
    const { setToken, setIdentifier } = useRegisterContext()

    const router = useRouter()
    const { query: { next } } = router
    const redirectUrl = (next && !Array.isArray(next) && isSafeUrl(next)) ? next : '/'

    const [isLoading, setIsLoading] = useState(false)

    const registerIdentifierRules = useMemo(
        () => [{ required: true, message: FieldIsRequiredMessage }],
        [FieldIsRequiredMessage]
    )

    const onError = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [TOO_MANY_REQUESTS]: 'identifier',
        },
    })
    const [startConfirmPhoneAction] = useStartConfirmPhoneActionMutation({
        onError,
    })
    const [startConfirmEmailAction] = useStartConfirmEmailActionMutation({
        onError,
    })

    const startConfirmIdentifier = useCallback(async () => {
        if (isLoading) return

        const { identifier: inputIdentifier } = form.getFieldsValue(['identifier'])
        const identifier = normalizeUserIdentifier(inputIdentifier)
        if (!identifier.normalizedValue) {
            form.setFields([
                {
                    name: 'identifier',
                    errors: [WrongIdentifierFormatErrorMessage],
                },
            ])
            return
        }
        setIdentifier(identifier.normalizedValue)
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
                res = await startConfirmEmailAction({
                    variables: {
                        data: {
                            ...commonPayload,
                            email: identifier.normalizedValue,
                        },
                    },
                })
            } else {
                res = await startConfirmPhoneAction({
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
                setToken(token)
                await router.push(`/auth/register?token=${token}&${queryParams}`)
                onFinish()
                return
            }
        } catch (error) {
            console.error('Start confirm identifier action failed')
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
    }, [TooManyRequestsErrorMessage, WrongIdentifierFormatErrorMessage, executeCaptcha, form, isLoading, onFinish, queryParams, setIdentifier, setToken, startConfirmEmailAction, startConfirmPhoneAction])

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
                    name='register-input-identifier'
                    onFinish={startConfirmIdentifier}
                    requiredMark={false}
                    layout='vertical'
                >
                    <Row justify='start'>
                        <ResponsiveCol span={24}>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    {
                                        authMethods.phonePassword && !authMethods.emailPassword && (
                                            <FormItem
                                                name='identifier'
                                                label={PhoneMessage}
                                                rules={registerIdentifierRules}
                                                data-cy='register-identifier-item'
                                            >
                                                <Input.Phone country={defaultLocale} placeholder={ExamplePhoneMessage} inputProps={IDENTIFIER_INPUT_PROPS} />
                                            </FormItem>
                                        )
                                    }
                                    {
                                        !authMethods.phonePassword && authMethods.emailPassword && (
                                            <FormItem
                                                name='identifier'
                                                label={EmailMessage}
                                                rules={registerIdentifierRules}
                                                data-cy='register-identifier-item'
                                            >
                                                <Input placeholder={ExampleEmailMessage} {...IDENTIFIER_INPUT_PROPS} />
                                            </FormItem>
                                        )
                                    }
                                    {
                                        authMethods.phonePassword && authMethods.emailPassword && (
                                            <FormItem
                                                name='identifier'
                                                label={PhoneOrEmailMessage}
                                                rules={registerIdentifierRules}
                                                data-cy='register-identifier-item'
                                            >
                                                <Input {...IDENTIFIER_INPUT_PROPS} />
                                            </FormItem>
                                        )
                                    }
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
                                                <Col span={24} id='inputIdentifierSBBOL'>
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
