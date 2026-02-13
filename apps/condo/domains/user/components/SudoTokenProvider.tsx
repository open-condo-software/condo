import {
    useGenerateSudoTokenMutation,
    GenerateSudoTokenMutationVariables,
    useStartConfirmEmailActionMutation,
    useCompleteConfirmEmailActionMutation,
    useStartConfirmPhoneActionMutation,
    useCompleteConfirmPhoneActionMutation,
} from '@app/condo/gql'
import { UserTypeType } from '@app/condo/schema'
import { Form, Row, Col } from 'antd'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import Link from 'next/link'
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Input, Modal, Radio, Space, Typography, type TypographyLinkProps } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { NOT_NUMBER_REGEX } from '@condo/domains/common/constants/regexps'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { CREDENTIAL_VALIDATION_FAILED, NOT_ENOUGH_AUTH_FACTORS } from '@condo/domains/user/constants/errors'

import { SecondaryLink } from './auth/SecondaryLink'

import type { GraphQLFormattedError } from 'graphql'


const RESET_PASSWORD_URL = '/auth/forgot?next=/user/update'

type UserIdentifierType = Pick<GenerateSudoTokenMutationVariables['data']['user'], 'email' | 'phone'>
type GetSudoTokenForceDataType = {
    user: Pick<GenerateSudoTokenMutationVariables['data']['user'], 'email' | 'phone'>
    authFactors: Pick<GenerateSudoTokenMutationVariables['data']['authFactors'], 'password'>
}
type SudoTokenContextType = {
    getSudoTokenWithModal: (userIdentifier: UserIdentifierType, labels?: { passwordTitle?: string, passwordDescription?: string }) => Promise<string>
    getSudoTokenForce: (data: GetSudoTokenForceDataType) => Promise<string>
    clearSudoToken: () => void
}
type UseSudoTokenContext = () => SudoTokenContextType

const SudoTokenContext = createContext<SudoTokenContextType>({
    clearSudoToken: () => ({}),
    getSudoTokenWithModal: () => Promise.resolve(''),
    getSudoTokenForce: () => Promise.resolve(''),
})

export const useSudoToken: UseSudoTokenContext = () => useContext(SudoTokenContext)


const {
    publicRuntimeConfig: { HelpRequisites },
} = getConfig()

export const SudoTokenProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const intl = useIntl()
    const Email = intl.formatMessage({ id: 'Email' }).toLowerCase()
    const Phone = intl.formatMessage({ id: 'Phone' }).toLowerCase()
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePassword' })
    const PasswordTitle = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.title' })
    const PasswordLabel = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.label' })
    const ChangeEmailWidthPasswordDescription = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.description' }, { identifier: Email })
    const ChangePhoneWidthPasswordDescription = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.description' }, { identifier: Phone })
    const Done = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.done' })
    const WrongPasswordMessage = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.error.wrongPassword' })
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
    const SecondFactorTitle = intl.formatMessage({ id: 'component.SecondFactorForm.title' })
    const ConfirmPhoneTokenLabel = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmPhoneToken.label' })
    const ConfirmEmailTokenLabel = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmEmailToken.label' })
    const ConfirmPhoneTokenDescription = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmPhoneToken.description' })
    const ConfirmEmailTokenDescription = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmEmailToken.description' })
    const SendEmailCodeAgainMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmEmailToken.sendCodeAgain' })
    const SendPhoneCodeAgainMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmPhoneToken.sendCodeAgain' })
    const EmailProblemsMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmEmailToken.problems' })
    const PhoneProblemsMessage = intl.formatMessage({ id: 'component.SecondFactorForm.type.confirmPhoneToken.problems' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })

    const hasSupportTelegramChat = !!HelpRequisites?.support_bot

    const sudoTokenRef = useRef<string>(null)
    const [problemsModalType, setProblemsModalType] = useState<'phone' | 'email'>(null)
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
    const [isSecondFactorModalVisible, setIsSecondFactorModalVisible] = useState<boolean>(false)
    const resolveRef = useRef<(value: (string)) => void>(null)
    const rejectRef = useRef<(reason: Error) => void>(null)
    const currentPromiseRef = useRef<Promise<string> | null>(null)
    const userIdentifierRef = useRef<UserIdentifierType>()
    const [passwordDescription, setPasswordDescription] = useState<string>(ChangeEmailWidthPasswordDescription)
    const [passwordTitle, setPasswordTitle] = useState<string>(PasswordTitle)
    const [currentSecondFactor, setConfirmActionType] = useState<'confirmPhoneToken' | 'confirmEmailToken'>(null)
    const [availableSecondFactors, setAvailableSecondFactors] = useState<Array<'confirmPhoneToken' | 'confirmEmailToken'>>([])
    const userIdRef = useRef<string>(null)
    const [confirmEmailToken, setConfirmEmailToken] = useState<string>(null)
    const [confirmPhoneToken, setConfirmPhoneToken] = useState<string>(null)
    const [confirmEmailTokenExpiredDate, setConfirmEmailTokenExpiredDate] = useState<string>(null)
    const [confirmPhoneTokenExpiredDate, setConfirmPhoneTokenExpiredDate] = useState<string>(null)
    const [userMaskedData, setUserMaskedData] = useState<{ email?: string, phone?: string } | null>(null)

    const { executeCaptcha } = useHCaptcha()
    const { requiredValidator } = useValidations()
    const [form] = Form.useForm()

    const [generateSudoTokenMutation] = useGenerateSudoTokenMutation({
        onError: (error) => {
            if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === CREDENTIAL_VALIDATION_FAILED)) {
                form.setFields([{
                    name: 'password',
                    errors: [WrongPasswordMessage],
                }])
            } else if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === NOT_ENOUGH_AUTH_FACTORS)) {
                // show modal with 2FA
                // handled outside the error handler
            } else  {
                const gqlError = error?.graphQLErrors?.[0]
                const errorMessage = (gqlError?.extensions?.messageForUser || gqlError?.extensions?.message) as string
                form.setFields([{
                    name: 'password',
                    errors: [errorMessage],
                }])
            }
        },
    })

    const errorHandler = useMutationErrorHandler()
    const [startConfirmEmailActionMutation] = useStartConfirmEmailActionMutation({
        onError: errorHandler,
    })
    const [completeConfirmEmailMutation] = useCompleteConfirmEmailActionMutation({
        onError: () => {},
    })
    const [startConfirmPhoneActionMutation] = useStartConfirmPhoneActionMutation({
        onError: errorHandler,
    })
    const [completeConfirmPhoneMutation] = useCompleteConfirmPhoneActionMutation({
        onError: () => {},
    })

    const openModal = useCallback(() => {
        setIsModalVisible(true)
    }, [])

    const closeModal = useCallback(() => {
        form.resetFields()
        setIsModalVisible(false)
        setIsSecondFactorModalVisible(false)
        setConfirmActionType(null)
        setAvailableSecondFactors([])
        userIdRef.current = null
    }, [form])

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

    const handleGetSudoToken = useCallback(async (values) => {
        if (!userIdentifierRef.current) return

        const captcha = await executeCaptcha()
        const res = await generateSudoTokenMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    captcha,
                    user: {
                        userType: UserTypeType.Staff,
                        ...(userIdentifierRef.current.phone ? { phone: userIdentifierRef.current.phone } : null),
                        ...(userIdentifierRef.current.email ? { email: userIdentifierRef.current.email } : null),
                    },
                    authFactors: {
                        password: values?.password || '',
                        ...(values?.confirmEmailToken ? { confirmEmailToken: values.confirmEmailToken } : null),
                        ...(values?.confirmPhoneToken ? { confirmPhoneToken: values.confirmPhoneToken } : null),
                    },
                },
            },
        })

        const isNotEnoughAuthFactors = (error: GraphQLFormattedError) => error?.extensions?.type === NOT_ENOUGH_AUTH_FACTORS
        // @ts-ignore
        if (res?.errors?.graphQLErrors?.some(isNotEnoughAuthFactors)) {
            // @ts-ignore
            const graphQLError = res?.errors?.graphQLErrors.find(isNotEnoughAuthFactors)
            const authDetails = graphQLError?.extensions?.authDetails

            if (authDetails?.is2FAEnabled && authDetails?.userId && authDetails?.availableSecondFactors?.length > 0) {
                userIdRef.current = authDetails.userId
                const availableSecondFactors = authDetails?.availableSecondFactors?.filter(factor => ['confirmPhoneToken', 'confirmEmailToken'].includes(factor)) || []
                const prioritySecondFactor = currentSecondFactor || availableSecondFactors?.[0] || null

                if (availableSecondFactors.length > 0) {
                    setUserMaskedData(authDetails?.maskedData || null)
                    setAvailableSecondFactors(availableSecondFactors)
                    setConfirmActionType(prioritySecondFactor)
                    setIsModalVisible(false)
                    setIsSecondFactorModalVisible(true)
                }
            }
        }

        const token = res?.data?.result?.token || null

        sudoTokenRef.current = token

        if (res?.errors?.length > 0 || !token) {
            return
        }

        if (resolveRef.current) {
            resolveRef.current(token)
            resolveRef.current = null
        }
        if (rejectRef.current) {
            rejectRef.current = null
        }

        currentPromiseRef.current = null

        closeModal()
    }, [closeModal, currentSecondFactor, executeCaptcha, generateSudoTokenMutation])

    const handleChangeCodeInput = useCallback(async () => {
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
        } else {
            console.error(`Unexpected currentSecondFactor: "${currentSecondFactor}"`)
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

        } else if (res?.data?.result?.status === 'ok') {
            await handleGetSudoToken({
                password,
                ...(currentSecondFactor === 'confirmPhoneToken' ? ({ confirmPhoneToken }) : null),
                ...(currentSecondFactor === 'confirmEmailToken' ? ({ confirmEmailToken }) : null),
            })
            setConfirmEmailToken(null)
            setConfirmPhoneToken(null)
        }

    }, [completeConfirmEmailMutation, completeConfirmPhoneMutation, currentSecondFactor, confirmEmailToken, confirmPhoneToken, executeCaptcha, form, handleGetSudoToken])

    const handleCancel = useCallback(() => {
        resolveRef.current = null
        if (rejectRef.current) {
            rejectRef.current(new Error('cancelled'))
            rejectRef.current = null
        }
        currentPromiseRef.current = null

        closeModal()
    }, [closeModal])

    const getSudoTokenWithModal: SudoTokenContextType['getSudoTokenWithModal'] = useCallback((userIdentifier, { passwordTitle, passwordDescription } = {}) => {
        if (currentPromiseRef.current) {
            return currentPromiseRef.current
        }

        if (sudoTokenRef.current) {
            return Promise.resolve(sudoTokenRef.current)
        }

        setPasswordTitle(passwordTitle ?? PasswordTitle)
        setPasswordDescription(passwordDescription ?? (userIdentifier.phone ? ChangeEmailWidthPasswordDescription : ChangePhoneWidthPasswordDescription))
        currentPromiseRef.current = new Promise<string>((resolve, reject) => {
            resolveRef.current = resolve
            rejectRef.current = reject
            openModal()
        })
        userIdentifierRef.current = userIdentifier

        return currentPromiseRef.current
    }, [openModal])

    const getSudoTokenForce: SudoTokenContextType['getSudoTokenForce'] = useCallback(async (data) => {
        const captcha = await executeCaptcha()
        const res = await generateSudoTokenMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    captcha,
                    user: {
                        ...data.user,
                        userType: UserTypeType.Staff,
                    },
                    authFactors: data.authFactors,
                },
            },
        })

        const token = res?.data?.result?.token || null

        sudoTokenRef.current = token

        return sudoTokenRef.current
    }, [executeCaptcha, generateSudoTokenMutation])

    const clearSudoToken = useCallback(() => {
        sudoTokenRef.current = null
    }, [])

    const handleResetPassword: TypographyLinkProps['onClick'] = useCallback((event) => {
        // NOTE: Close modal only if link opens in current tab
        if (
            event.metaKey           // Cmd (Mac)
            || event.ctrlKey        // Ctrl (Win/Linux)
            || event.shiftKey       // Shift + Click (new window)
            || event.button === 1   // Middle mouse button
        ) {
            return
        }

        handleCancel()
    }, [handleCancel])

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

    return (
        <SudoTokenContext.Provider
            value={{
                getSudoTokenWithModal,
                getSudoTokenForce,
                clearSudoToken,
            }}
        >
            {children}
            <Form
                onFinish={handleGetSudoToken}
                initialValues={{ password: '' }}
                form={form}
                validateTrigger={['onBlur', 'onSubmit']}
            >
                <Modal
                    open={isModalVisible}
                    title={passwordTitle}
                    onCancel={handleCancel}
                    footer={(
                        <Button
                            type='primary'
                            onClick={form.submit}
                        >
                            {Done}
                        </Button>
                    )}
                >
                    <Row gutter={[0, 40]}>
                        {
                            passwordDescription && (
                                <Col span={24}>
                                    <Alert
                                        type='warning'
                                        showIcon
                                        description={passwordDescription}
                                    />
                                </Col>
                            )
                        }

                        <Col span={24}>
                            <Row gutter={[0, 24]}>
                                <Col span={24}>
                                    <FormItem
                                        name='password'
                                        required={false}
                                        rules={[requiredValidator]}
                                        label={!passwordDescription && PasswordLabel}
                                        labelCol={{ span: 24 }}
                                    >
                                        <Input.Password />
                                    </FormItem>
                                </Col>

                                <Col span={24}>
                                    <Link href={RESET_PASSWORD_URL} onClick={handleResetPassword}>
                                        <Typography.Link href={RESET_PASSWORD_URL}>
                                            {ChangePasswordLabel}
                                        </Typography.Link>
                                    </Link>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Modal>
                <Modal
                    open={isSecondFactorModalVisible}
                    title={SecondFactorTitle}
                    onCancel={handleCancel}
                >
                    <Row gutter={[0, 40]}>
                        {
                            availableSecondFactors?.length > 1 && (
                                <Radio.Group
                                    optionType='button'
                                    value={currentSecondFactor}
                                    onChange={(event) => setConfirmActionType(event.target.value)}
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

                                </Radio.Group>
                            )
                        }

                        {
                            currentSecondFactor === 'confirmPhoneToken' && (
                                <Row gutter={[0, 24]}>
                                    <Col span={24}>
                                        <FormItem
                                            required={false}
                                            name='confirmPhoneCode'
                                            label={ConfirmPhoneTokenDescription.replace('{phone}', formatPhone(userMaskedData?.phone || '', true))}
                                        >
                                            <Input maxLength={4} onChange={handleChangeCodeInput} />
                                        </FormItem>
                                    </Col>
                                    <Col span={24}>
                                        <Row gutter={[0, 4]}>
                                            <Col span={24}>
                                                <Typography.Link onClick={startConfirmPhoneAction}>{SendPhoneCodeAgainMessage}</Typography.Link>
                                            </Col>
                                            <Col span={24}>
                                                <Typography.Link onClick={() => {
                                                    setIsSecondFactorModalVisible(false)
                                                    setProblemsModalType('phone')
                                                }}>{PhoneProblemsMessage}</Typography.Link>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            )
                        }
                        {
                            currentSecondFactor === 'confirmEmailToken' && (
                                <Row gutter={[0, 24]}>
                                    <Col span={24}>
                                        <FormItem
                                            required={false}
                                            name='confirmEmailCode'
                                            label={ConfirmEmailTokenDescription.replace('{email}', userMaskedData?.email || '')}
                                        >
                                            <Input maxLength={4} onChange={handleChangeCodeInput} />
                                        </FormItem>
                                    </Col>
                                    <Col span={24}>
                                        <Row gutter={[0, 4]}>
                                            <Col span={24}>
                                                <Typography.Link onClick={startConfirmEmailAction}>{SendEmailCodeAgainMessage}</Typography.Link>
                                            </Col>
                                            <Col span={24}>
                                                <Typography.Link onClick={() => {
                                                    setIsSecondFactorModalVisible(false)
                                                    setProblemsModalType('email')
                                                }}>{EmailProblemsMessage}</Typography.Link>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            )
                        }
                    </Row>
                </Modal>
            </Form>
            <Modal
                open={!!problemsModalType}
                title={problemsModalType === 'email' ? MailProblemsModalTitle : SmsProblemsModalTitle}
                width='small'
                onCancel={() => {
                    setProblemsModalType(null)
                    setIsSecondFactorModalVisible(true)
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
        </SudoTokenContext.Provider>
    )
}
