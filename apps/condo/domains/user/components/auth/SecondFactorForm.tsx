import {
    useStartConfirmEmailActionMutation,
    useCompleteConfirmEmailActionMutation,
    useStartConfirmPhoneActionMutation,
    useCompleteConfirmPhoneActionMutation,
} from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Input, Space, Radio, Modal, Button } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { NOT_NUMBER_REGEX } from '@condo/domains/common/constants/regexps'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'

import { SecondaryLink } from './SecondaryLink'


const { publicRuntimeConfig: { HelpRequisites } } = getConfig()

export const useSecondFactor = ({
    form,
    onSubmit,
    Header,
    isLoading,
    setIsLoading,
}) => {
    const intl = useIntl()
    const ConfirmPhoneTokenLabel = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmPhoneToken.label' })
    const ConfirmEmailTokenLabel = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmEmailToken.label' })
    const PasswordLabel = intl.formatMessage({ id: 'component.SecondFactorForm.type.password.label' })
    const ConfirmPhoneTokenDescription = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmPhoneToken.description' })
    const ConfirmEmailTokenDescription = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmEmailToken.description' })
    const PasswordDescription = intl.formatMessage({ id: 'component.SecondFactorForm.type.password.description' })
    const SendEmailCodeAgainMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmEmailToken.sendCodeAgain' })
    const SendPhoneCodeAgainMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmPhoneToken.sendCodeAgain' })
    const EmailProblemsMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmEmailToken.problems' })
    const PhoneProblemsMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmPhoneToken.problems' })
    const PasswordContinueMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.password.continue' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const ResetPasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.ResetPasswordLink' })
    const SmsProblemsModalTitle = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.smsProblemsModal.title' })
    const MailProblemsModalTitle = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.mailProblemsModal.title' })
    const InstructionStepCheckPhone = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.problemsModal.instruction.steps.checkPhone' })
    const InstructionStepCheckEmail = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.problemsModal.instruction.steps.checkEmail' })
    const ChatInTelegramMessage = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.problemsModal.instruction.steps.supportTelegramChat.chatInTelegram' })
    const InstructionStepSupportTelegramChat = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.problemsModal.instruction.steps.supportTelegramChat' }, {
        chatBotLink: (
            <SecondaryLink target='_blank' href={HelpRequisites?.support_bot ? `https://t.me/${HelpRequisites.support_bot}` : '#'}>
                {ChatInTelegramMessage}
            </SecondaryLink>
        ),
    })

    const hasSupportTelegramChat = !!HelpRequisites?.support_bot

    const [problemsModalType, setProblemsModalType] = useState<'phone' | 'email'>(null)
    const [currentSecondFactor, setCurrentSecondFactor] = useState<'confirmPhoneToken' | 'confirmEmailToken' | 'password'>(null)
    const [availableSecondFactors, setAvailableSecondFactors] = useState<Array<'confirmPhoneToken' | 'confirmEmailToken' | 'password'>>([])
    const userIdRef = useRef<string>(null)
    const [confirmEmailToken, setConfirmEmailToken] = useState<string>(null)
    const [confirmPhoneToken, setConfirmPhoneToken] = useState<string>(null)
    const [confirmEmailTokenExpiredDate, setConfirmEmailTokenExpiredDate] = useState<string>(null)
    const [confirmPhoneTokenExpiredDate, setConfirmPhoneTokenExpiredDate] = useState<string>(null)
    const [userMaskedData, setUserMaskedData] = useState<{ email?: string, phone?: string } | null>(null)

    const { executeCaptcha } = useHCaptcha()

    const router = useRouter()
    const { query: { next }  } = router
    const redirectUrl = (next && !Array.isArray(next) && isSafeUrl(next)) ? next : '/'

    const confirmActionErrorHandler = useMutationErrorHandler()
    const [startConfirmEmailActionMutation] = useStartConfirmEmailActionMutation({
        onError: confirmActionErrorHandler,
    })
    const [completeConfirmEmailMutation] = useCompleteConfirmEmailActionMutation({
        onError: () => {},
    })
    const [startConfirmPhoneActionMutation] = useStartConfirmPhoneActionMutation({
        onError: confirmActionErrorHandler,
    })
    const [completeConfirmPhoneMutation] = useCompleteConfirmPhoneActionMutation({
        onError: () => {},
    })

    const onSubmitWithSecondFactor = useCallback(async (): Promise<void> => {
        const { password } = form.getFieldsValue(['password'])

        await onSubmit({
            isLoading,
            setIsLoading,
            userIdRef,
            setUserMaskedData,
            setAvailableSecondFactors,
            setCurrentSecondFactor,
            currentSecondFactor,
            confirmEmailToken,
            confirmPhoneToken,
            password,
        })
    }, [form, onSubmit, isLoading, setIsLoading, currentSecondFactor, confirmEmailToken, confirmPhoneToken])

    const startConfirmEmailAction = useCallback(async () => {
        if (!userIdRef.current) {
            throw new Error('No userid for StartConfirmEmailAction!')
        }

        const shouldWait = confirmEmailTokenExpiredDate && dayjs(confirmEmailTokenExpiredDate) > dayjs()
        if (shouldWait) return

        setConfirmEmailTokenExpiredDate(dayjs().add(1, 'minute').toISOString())

        const sender = getClientSideSenderInfo()
        const captcha = await executeCaptcha()

        const res = await startConfirmEmailActionMutation({
            variables: {
                data: {
                    dv: 1,
                    sender,
                    captcha,
                    user: {
                        id: userIdRef.current,
                    },
                },
            },
        })

        setConfirmEmailTokenExpiredDate(dayjs().add(1, 'minute').toISOString())

        const token = res?.data?.result?.token
        if (token) {
            setConfirmEmailToken(token)
        }

        return res
    }, [executeCaptcha, startConfirmEmailActionMutation, confirmEmailTokenExpiredDate])

    const startConfirmPhoneAction = useCallback(async () => {
        if (!userIdRef.current) {
            throw new Error('No userid for StartConfirmPhoneAction!')
        }

        const shouldWait = confirmPhoneTokenExpiredDate && dayjs(confirmPhoneTokenExpiredDate) > dayjs()
        if (shouldWait) return

        setConfirmPhoneTokenExpiredDate(dayjs().add(1, 'minute').toISOString())

        const sender = getClientSideSenderInfo()
        const captcha = await executeCaptcha()

        const res = await startConfirmPhoneActionMutation({
            variables: {
                data: {
                    dv: 1,
                    sender,
                    captcha,
                    user: {
                        id: userIdRef.current,
                    },
                },
            },
        })

        setConfirmPhoneTokenExpiredDate(dayjs().add(1, 'minute').toISOString())

        const token = res?.data?.result?.token
        if (token) {
            setConfirmPhoneToken(token)
        }

        return res
    }, [executeCaptcha, startConfirmPhoneActionMutation, confirmPhoneTokenExpiredDate])

    const handleChangeSecondFactorInput = useCallback(async () => {
        const { confirmPhoneCode = '', confirmEmailCode = '', password } = form.getFieldsValue(['confirmPhoneCode', 'confirmEmailCode', 'password'])

        const normalizedConfirmPhoneCode = confirmPhoneCode.replace(NOT_NUMBER_REGEX, '')
        const normalizedConfirmEmailCode = confirmEmailCode.replace(NOT_NUMBER_REGEX, '')
        form.setFieldsValue({
            confirmPhoneCode: normalizedConfirmPhoneCode,
            confirmEmailCode: normalizedConfirmEmailCode,
        })

        if (currentSecondFactor === 'confirmPhoneToken' && (!normalizedConfirmPhoneCode || normalizedConfirmPhoneCode.length !== 4)) return
        if (currentSecondFactor === 'confirmEmailToken' && (!normalizedConfirmEmailCode || normalizedConfirmEmailCode.length !== 4)) return

        const sender = getClientSideSenderInfo()
        const captcha = await executeCaptcha()

        let res

        if (currentSecondFactor === 'confirmPhoneToken') {
            res = await completeConfirmPhoneMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        token: confirmPhoneToken,
                        smsCode: Number(normalizedConfirmPhoneCode),
                    },
                },
            })
        } else if (currentSecondFactor === 'confirmEmailToken') {
            res = await completeConfirmEmailMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        token: confirmEmailToken,
                        secretCode: normalizedConfirmEmailCode,
                    },
                },
            })
        }

        if (res?.errors) {
            // @ts-ignore
            const errorMessage = res.errors?.graphQLErrors?.[0]?.extensions?.messageForUser || ServerErrorMessage

            if (currentSecondFactor === 'confirmPhoneToken') {
                form.setFields([{
                    name: 'confirmPhoneCode',
                    errors: [errorMessage],
                }])
            } else if (currentSecondFactor === 'confirmEmailToken') {
                form.setFields([{
                    name: 'confirmEmailCode',
                    errors: [errorMessage],
                }])
            }

        } else if (res?.data?.result?.status === 'ok' || currentSecondFactor === 'password') {
            await onSubmitWithSecondFactor()
            setConfirmEmailToken(null)
            setConfirmPhoneToken(null)
        }

    }, [completeConfirmEmailMutation, completeConfirmPhoneMutation, currentSecondFactor, confirmEmailToken, confirmPhoneToken, executeCaptcha, form, onSubmitWithSecondFactor])

    useEffect(() => {
        if (currentSecondFactor !== 'confirmEmailToken' && currentSecondFactor !== 'confirmPhoneToken') return
        if (!userIdRef.current) return

        if (currentSecondFactor === 'confirmPhoneToken') {
            // send sms-code by userId
            startConfirmPhoneAction()
        } else if (currentSecondFactor === 'confirmEmailToken') {
            // send email-code by userId
            startConfirmEmailAction()
        }
    }, [currentSecondFactor])

    const SecondFactorForm = useMemo(() => (
        <Row justify='center' style={!currentSecondFactor && { display: 'none' }}>
            <ResponsiveCol span={24}>
                <Row gutter={[0, 40]} justify='center'>
                    {
                        Header && (
                            <Header
                                setCurrentSecondFactor={setCurrentSecondFactor}
                                setAvailableSecondFactors={setAvailableSecondFactors}
                            />
                        )
                    }

                    <Col span={24}>
                        <Row gutter={[0, 40]}>
                            {
                                availableSecondFactors?.length > 1 && (
                                    <Radio.Group
                                        optionType='button'
                                        value={currentSecondFactor}
                                        onChange={(event) => setCurrentSecondFactor(event.target.value)}
                                    >
                                        {
                                            availableSecondFactors?.includes('confirmPhoneToken') && (
                                                <Radio label={ConfirmPhoneTokenLabel} value='confirmPhoneToken' />
                                            )
                                        }
                                        {
                                            availableSecondFactors?.includes('confirmEmailToken') && (
                                                <Radio label={ConfirmEmailTokenLabel} value='confirmEmailToken' />
                                            )
                                        }
                                        {
                                            availableSecondFactors?.includes('password') && (
                                                <Radio label={PasswordLabel} value='password' />
                                            )
                                        }
                                    </Radio.Group>
                                )
                            }

                            {
                                availableSecondFactors?.includes('confirmPhoneToken') && currentSecondFactor === 'confirmPhoneToken' && (
                                    <Row gutter={[0, 24]}>
                                        <Col span={24}>
                                            <FormItem
                                                required={false}
                                                name='confirmPhoneCode'
                                                label={ConfirmPhoneTokenDescription.replace('{phone}', formatPhone(userMaskedData?.phone || '', true))}
                                            >
                                                <Input maxLength={4} onChange={handleChangeSecondFactorInput} />
                                            </FormItem>
                                        </Col>
                                        <Col span={24}>
                                            <Row gutter={[0, 4]}>
                                                <Col span={24}>
                                                    <Typography.Link onClick={startConfirmPhoneAction}>{SendPhoneCodeAgainMessage}</Typography.Link>
                                                </Col>
                                                <Col span={24}>
                                                    <Typography.Link onClick={() => {
                                                        setProblemsModalType('phone')
                                                    }}>{PhoneProblemsMessage}</Typography.Link>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                )
                            }
                            {
                                availableSecondFactors?.includes('confirmEmailToken') && currentSecondFactor === 'confirmEmailToken' && (
                                    <Row gutter={[0, 24]}>
                                        <Col span={24}>
                                            <FormItem
                                                required={false}
                                                name='confirmEmailCode'
                                                label={ConfirmEmailTokenDescription.replace('{email}', userMaskedData?.email || '')}
                                            >
                                                <Input maxLength={4} onChange={handleChangeSecondFactorInput} />
                                            </FormItem>
                                        </Col>
                                        <Col span={24}>
                                            <Row gutter={[0, 4]}>
                                                <Col span={24}>
                                                    <Typography.Link onClick={startConfirmEmailAction}>{SendEmailCodeAgainMessage}</Typography.Link>
                                                </Col>
                                                <Col span={24}>
                                                    <Typography.Link onClick={() => {
                                                        setProblemsModalType('email')
                                                    }}>{EmailProblemsMessage}</Typography.Link>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                )
                            }
                            {
                                availableSecondFactors?.includes('password') && currentSecondFactor === 'password' && (
                                    <Row gutter={[24, 24]}>
                                        <Col span={24}>
                                            <Row>
                                                <Col span={24}>
                                                    <Typography.Text>{PasswordDescription}</Typography.Text>
                                                    <FormItem
                                                        required={false}
                                                        name='password'
                                                    >
                                                        <Input.Password />
                                                    </FormItem>
                                                </Col>
                                                <Col span={24}>
                                                    <Typography.Link
                                                        component={Link}
                                                        href={`/auth/forgot?next=${encodeURIComponent(redirectUrl)}`}
                                                    >
                                                        {ResetPasswordMessage}
                                                    </Typography.Link>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col span={24}>
                                            <Button
                                                id='sendPassword'
                                                type='primary'
                                                onClick={handleChangeSecondFactorInput}
                                                block
                                            >
                                                {PasswordContinueMessage}
                                            </Button>
                                        </Col>
                                    </Row>
                                )
                            }
                        </Row>
                    </Col>
                </Row>
            </ResponsiveCol>
        </Row>
    ), [ConfirmEmailTokenDescription, ConfirmEmailTokenLabel, ConfirmPhoneTokenDescription, ConfirmPhoneTokenLabel, EmailProblemsMessage, Header, PasswordDescription, PasswordLabel, PhoneProblemsMessage, ResetPasswordMessage, SendEmailCodeAgainMessage, SendPhoneCodeAgainMessage, availableSecondFactors, currentSecondFactor, handleChangeSecondFactorInput, redirectUrl, startConfirmEmailAction, startConfirmPhoneAction])

    const ProblemsModal = useMemo(() => (
        <Modal
            open={!!problemsModalType}
            title={problemsModalType === 'email' ? MailProblemsModalTitle : SmsProblemsModalTitle}
            width='small'
            onCancel={() => {
                setProblemsModalType(null)
            }}
        >
            <Space
                direction='vertical'
                size={0}
            >
                <Typography.Text type='secondary'>
                    {problemsModalType === 'email' ? InstructionStepCheckEmail : InstructionStepCheckPhone}
                </Typography.Text>
                {
                    hasSupportTelegramChat && (
                        <Typography.Text type='secondary'>
                            {InstructionStepSupportTelegramChat}
                        </Typography.Text>
                    )
                }
            </Space>
        </Modal>
    ), [InstructionStepCheckEmail, InstructionStepCheckPhone, InstructionStepSupportTelegramChat, MailProblemsModalTitle, SmsProblemsModalTitle, hasSupportTelegramChat, problemsModalType])

    return {
        SecondFactorForm,
        ProblemsModal,
        onSubmitWithSecondFactor,
        currentSecondFactor,
    }
}
