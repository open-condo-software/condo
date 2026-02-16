import {
    useCompleteConfirmPhoneActionMutation,
    useResendConfirmPhoneActionSmsMutation,
    useCompleteConfirmEmailActionMutation,
    useResendConfirmEmailActionMutation,
} from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useMemo, useState } from 'react'

import { ArrowLeft } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Input, Space, Modal, Button } from '@open-condo/ui'

import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { NOT_NUMBER_REGEX } from '@condo/domains/common/constants/regexps'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { SMS_CODE_LENGTH, SMS_CODE_TTL, SECRET_CODE_LENGTH, EMAIL_CODE_TTL } from '@condo/domains/user/constants/common'
import {
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    TOO_MANY_REQUESTS,
} from '@condo/domains/user/constants/errors'

import { useRegisterContext } from './RegisterContextProvider'
import { SecondaryLink } from './SecondaryLink'

import type { FetchResult } from '@apollo/client/link/core'
import type { CompleteConfirmEmailActionMutation, CompleteConfirmPhoneActionMutation } from '@app/condo/gql'


const {
    publicRuntimeConfig: { HelpRequisites },
} = getConfig()


type ValidateIdentifierFormProps = {
    onFinish: () => void
    onReset: () => void
    title: string
}

const INITIAL_VALUES = { confirmCode: '' }

export const ValidateIdentifierForm: React.FC<ValidateIdentifierFormProps> = ({ onFinish, onReset, title }) => {
    const intl = useIntl()
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const ResendSmsLabel = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.resendSms' })
    const ResendConfirmCodeLabel = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.resendConfirmCode' })
    const CodeAvailableLabel = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.codeIsAvailable' })
    const SmsCodeMismatchError = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.smsCodeMismatchError' })
    const ConfirmCodeMismatchError = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.confirmCodeMismatchError' })
    const SmsNotDeliveredMessage = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.smsNotDelivered' })
    const MailNotDeliveredMessage = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.mailNotDelivered' })
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

    const { token, identifier, identifierType } = useRegisterContext()
    const SmsCodeSentMessage = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.description.smsCodeSent' }, { phone: formatPhone(identifier) })
    const EmailCodeSentMessage = intl.formatMessage({ id: 'pages.auth.validateIdentifierForm.description.emailCodeSent' }, { email: identifier })

    const { executeCaptcha } = useHCaptcha()

    const [form] = Form.useForm()

    const [confirmCodeError, setConfirmCodeError] = useState(null)

    const [isOpenProblemsModal, setIsOpenProblemsModal] = useState<boolean>(false)

    const hasSupportTelegramChat = !!HelpRequisites?.support_bot

    const errorHandler = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED]: 'confirmCode',
            [CONFIRM_PHONE_ACTION_EXPIRED]: 'confirmCode',
            [CONFIRM_PHONE_SMS_CODE_EXPIRED]: 'confirmCode',
            [CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED]: 'confirmCode',
            [TOO_MANY_REQUESTS]: 'confirmCode',
        },
    })
    const [completeConfirmPhoneMutation] = useCompleteConfirmPhoneActionMutation({
        onError: errorHandler,
    })
    const [resendSmsMutation] = useResendConfirmPhoneActionSmsMutation({
        onError: errorHandler,
    })
    const [completeConfirmEmailMutation] = useCompleteConfirmEmailActionMutation({
        onError: errorHandler,
    })
    const [resendConfirmEmailMutation] = useResendConfirmEmailActionMutation({
        onError: errorHandler,
    })

    const confirmCodeValidator = useCallback(() => ({
        validator () {
            if (!confirmCodeError) {
                return Promise.resolve()
            }
            return Promise.reject(confirmCodeError)
        },
    }), [confirmCodeError])

    const confirmCodeValidatorRules = useMemo(() => [
        { required: true, message: FieldIsRequiredMsg }, confirmCodeValidator,
    ], [FieldIsRequiredMsg, confirmCodeValidator])

    const resendConfirmCode = useCallback(async () => {
        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()

            const resendConfirmCodeMutation = identifierType === 'email' ? resendConfirmEmailMutation : resendSmsMutation

            await resendConfirmCodeMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        token,
                    },
                },
            })
        } catch (error) {
            console.error('Code resending error')
            console.error(error)
        }
    }, [executeCaptcha, identifierType, resendConfirmEmailMutation, resendSmsMutation, token])

    const handleVerifyCode = useCallback(async () => {
        setConfirmCodeError(null)
        const confirmCodeFromInput = (form.getFieldValue('confirmCode') || '').toString()

        if (identifierType !== 'phone' && identifierType !== 'email') return

        let confirmCode = confirmCodeFromInput
        let confirmCodeAsNumber
        if (identifierType === 'phone') {
            confirmCode = confirmCodeFromInput.replace(NOT_NUMBER_REGEX, '')
            form.setFieldsValue({ confirmCode })
            if (confirmCode.length < SMS_CODE_LENGTH) {
                return
            }
            if (confirmCode.length > SMS_CODE_LENGTH) {
                return setConfirmCodeError(SmsCodeMismatchError)
            }

            confirmCodeAsNumber = Number(confirmCode)
            if (Number.isNaN(confirmCodeAsNumber)) {
                return setConfirmCodeError(SmsCodeMismatchError)
            }
        }

        if (identifierType === 'email') {
            confirmCode = confirmCodeFromInput
            form.setFieldsValue({ confirmCode })
            if (confirmCode.length < SECRET_CODE_LENGTH) {
                return
            }
            if (confirmCode.length > SECRET_CODE_LENGTH) {
                return setConfirmCodeError(ConfirmCodeMismatchError)
            }
        }

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            const commonPayload = {
                dv: 1,
                sender,
                captcha,
            }

            let res: FetchResult<CompleteConfirmEmailActionMutation> | FetchResult<CompleteConfirmPhoneActionMutation>
            if (identifierType === 'email') {
                res = await completeConfirmEmailMutation({
                    variables: {
                        data: {
                            ...commonPayload,
                            token,
                            secretCode: confirmCode,
                        },
                    },
                })
            } else {
                res = await completeConfirmPhoneMutation({
                    variables: {
                        data: {
                            ...commonPayload,
                            token,
                            smsCode: confirmCodeAsNumber,
                        },
                    },
                })
            }

            if (!res.errors && res?.data?.result?.status === 'ok') {
                onFinish()
                return
            }
        } catch (error) {
            console.error('Verification error')
            console.error(error)
        }
    }, [completeConfirmEmailMutation, completeConfirmPhoneMutation, ConfirmCodeMismatchError, executeCaptcha, form, identifierType, onFinish, SmsCodeMismatchError, token])

    const closeModal = useCallback(() => setIsOpenProblemsModal(false), [])

    const openModal = useCallback(() => setIsOpenProblemsModal(true), [])

    return (
        <>
            <Form
                form={form}
                name='register-verify-code'
                initialValues={INITIAL_VALUES}
                colon={false}
                labelAlign='left'
                requiredMark={false}
                layout='vertical'
            >
                <Row justify='center'>
                    <ResponsiveCol span={24}>
                        <Row gutter={[0, 40]} justify='center'>
                            <Col span={24}>
                                <Row gutter={[0, 16]}>
                                    <Col span={24}>
                                        <Space direction='vertical' size={24}>
                                            <Button.Icon onClick={onReset} size='small'>
                                                <ArrowLeft />
                                            </Button.Icon>
                                            <Typography.Title level={2}>{title}</Typography.Title>
                                        </Space>
                                    </Col>
                                    <Col span={24}>
                                        <Typography.Text type='secondary'>
                                            {identifierType === 'email' ? EmailCodeSentMessage : SmsCodeSentMessage}
                                        </Typography.Text>
                                    </Col>
                                    <Col span={24}>
                                        <FormItem
                                            name='confirmCode'
                                            label=' '
                                            data-cy='register-confirm-code-item'
                                            rules={confirmCodeValidatorRules}
                                        >
                                            <Input
                                                placeholder=''
                                                inputMode={identifierType === 'email' ? 'text' : 'numeric'}
                                                pattern={identifierType === 'email' ? undefined : '[0-9]'}
                                                onChange={handleVerifyCode}
                                                tabIndex={1}
                                                autoFocus
                                            />
                                        </FormItem>
                                    </Col>
                                </Row>
                            </Col>

                            <Col span={24}>
                                <Space size={12} direction='vertical'>
                                    <CountDownTimer
                                        action={resendConfirmCode}
                                        id='RESEND_CONFIRM_CODE'
                                        timeout={identifierType === 'email' ? EMAIL_CODE_TTL : SMS_CODE_TTL}
                                        autostart={true}
                                    >
                                        {({ countdown, runAction }) => {
                                            const isCountDownActive = countdown > 0
                                            return (
                                                isCountDownActive
                                                    ? (
                                                        <Space direction='horizontal' size={8}>
                                                            <Typography.Text type='secondary'>
                                                                {CodeAvailableLabel}
                                                            </Typography.Text>
                                                            <Typography.Text type='secondary'>
                                                                {`${new Date(countdown * 1000).toISOString().substring(14, 19)}`}
                                                            </Typography.Text>
                                                        </Space>
                                                    )
                                                    : (
                                                        <Typography.Link onClick={runAction} tabIndex={2}>
                                                            {identifierType === 'email' ? ResendConfirmCodeLabel : ResendSmsLabel}
                                                        </Typography.Link>
                                                    )
                                            )
                                        }}
                                    </CountDownTimer>

                                    <Typography.Link onClick={openModal} tabIndex={3}>
                                        {identifierType === 'email' ? MailNotDeliveredMessage : SmsNotDeliveredMessage}
                                    </Typography.Link>
                                </Space>
                            </Col>
                        </Row>
                    </ResponsiveCol>
                </Row>
            </Form>

            <Modal
                open={isOpenProblemsModal}
                title={identifierType === 'email' ? MailProblemsModalTitle : SmsProblemsModalTitle}
                width='small'
                onCancel={closeModal}
            >
                <Space
                    direction='vertical'
                    size={0}
                >
                    <Typography.Text type='secondary'>
                        {identifierType === 'email' ? InstructionStepCheckEmail : InstructionStepCheckPhone}
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
        </>
    )
}
