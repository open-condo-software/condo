import { useCompleteConfirmPhoneActionMutation, useResendConfirmPhoneActionSmsMutation } from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useMemo, useState } from 'react'

import { ArrowLeft } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Input, Space, Modal, Button } from '@open-condo/ui'

import { CountDownTimer } from '@condo/domains/common/components/CountDownTimer'
import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { SMS_CODE_LENGTH, SMS_CODE_TTL } from '@condo/domains/user/constants/common'
import {
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    TOO_MANY_REQUESTS,
} from '@condo/domains/user/constants/errors'

import { useRegisterContext } from './RegisterContextProvider'

import './ValidatePhoneForm.css'


const {
    publicRuntimeConfig: { HelpRequisites },
} = getConfig()


type ValidatePhoneFormProps = {
    onFinish: () => void
    onReset: () => void
    title: string
}

const NOT_NUMBER_REGEX = /\D/g

const INITIAL_VALUES = { smsCode: '' }

export const ValidatePhoneForm: React.FC<ValidatePhoneFormProps> = ({ onFinish, onReset, title }) => {
    const intl = useIntl()
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const ResendSmsLabel = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.resendSms' })
    const codeAvailableLabel = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.codeIsAvailable' })
    const smsCodeMismatchError = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.smsCodeMismatchError' })
    const smsNotDeliveredMessage = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.smsNotDelivered' })
    const problemsModalTitle = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.problemsModal.title' })
    const checkPhoneLabel = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.problemsModal.checkPhone' })
    const instructionStepCheckPhone = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.problemsModal.instruction.steps.checkPhone' })
    const chatInTelegramMessage = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.problemsModal.instruction.steps.supportTelegramChat.chatInTelegram' })
    const instructionStepSupportTelegramChat = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.problemsModal.instruction.steps.supportTelegramChat' }, {
        chatBotLink: (
            <span className='secondary-link'>
                <Typography.Link target='_blank' href={HelpRequisites?.support_bot ? `https://t.me/${HelpRequisites.support_bot}` : '#'}>
                    {chatInTelegramMessage}
                </Typography.Link>
            </span>
        ),
    })

    const { token, phone } = useRegisterContext()
    const SmsCodeSentMessage = intl.formatMessage({ id: 'pages.auth.validatePhoneForm.description.smsCodeSent' }, { phone: formatPhone(phone) })

    const { executeCaptcha } = useHCaptcha()

    const [form] = Form.useForm()

    const [phoneValidateError, setPhoneValidateError] = useState(null)

    const [isOpenProblemsModal, setIsOpenProblemsModal] = useState<boolean>(false)

    const hasSupportTelegramChat = !!HelpRequisites?.support_bot

    const errorHandler = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            [CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED]: 'smsCode',
            [CONFIRM_PHONE_ACTION_EXPIRED]: 'smsCode',
            [CONFIRM_PHONE_SMS_CODE_EXPIRED]: 'smsCode',
            [CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED]: 'smsCode',
            [TOO_MANY_REQUESTS]: 'smsCode',
        },
    })
    const [completeConfirmPhoneMutation] = useCompleteConfirmPhoneActionMutation({
        onError: errorHandler,
    })
    const [resendSmsMutation] = useResendConfirmPhoneActionSmsMutation({
        onError: errorHandler,
    })

    const smsValidator = useCallback(() => ({
        validator () {
            if (!phoneValidateError) {
                return Promise.resolve()
            }
            return Promise.reject(phoneValidateError)
        },
    }), [phoneValidateError])

    const smsCodeValidatorRules = useMemo(() => [
        { required: true, message: FieldIsRequiredMsg }, smsValidator,
    ], [FieldIsRequiredMsg, smsValidator])

    const resendSms = useCallback(async () => {
        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()
            await resendSmsMutation({
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
    }, [executeCaptcha, resendSmsMutation, token])

    const handleVerifyCode = useCallback(async () => {
        setPhoneValidateError(null)
        const smsCodeFromInput = (form.getFieldValue('smsCode') || '').toString()
        const smsCode = smsCodeFromInput.replace(NOT_NUMBER_REGEX, '')
        form.setFieldsValue({ smsCode })
        if (smsCode.length < SMS_CODE_LENGTH) {
            return
        }
        if (smsCode.length > SMS_CODE_LENGTH) {
            return setPhoneValidateError(smsCodeMismatchError)
        }

        const smsCodeAsNumber = Number(smsCode)
        if (Number.isNaN(smsCodeAsNumber)) {
            return setPhoneValidateError(smsCodeMismatchError)
        }

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()

            const res = await completeConfirmPhoneMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        token,
                        smsCode: smsCodeAsNumber,
                    },
                },
            })

            if (!res.errors && res?.data?.result?.status === 'ok') {
                onFinish()
                return
            }
        } catch (error) {
            console.error('Phone verification error')
            console.error(error)
        }
    }, [smsCodeMismatchError, completeConfirmPhoneMutation, form, executeCaptcha, onFinish, token])

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
                                            {SmsCodeSentMessage}
                                        </Typography.Text>
                                    </Col>
                                    <Col span={24}>
                                        <FormItem
                                            name='smsCode'
                                            label=' '
                                            data-cy='register-smscode-item'
                                            rules={smsCodeValidatorRules}
                                        >
                                            <Input
                                                placeholder=''
                                                inputMode='numeric'
                                                pattern='[0-9]'
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
                                    <CountDownTimer action={resendSms} id='RESEND_SMS' timeout={SMS_CODE_TTL} autostart={true}>
                                        {({ countdown, runAction }) => {
                                            const isCountDownActive = countdown > 0
                                            return (
                                                isCountDownActive
                                                    ? (
                                                        <Space direction='horizontal' size={8}>
                                                            <Typography.Text type='secondary'>
                                                                {codeAvailableLabel}
                                                            </Typography.Text>
                                                            <Typography.Text type='secondary'>
                                                                {`${new Date(countdown * 1000).toISOString().substr(14, 5)}`}
                                                            </Typography.Text>
                                                        </Space>
                                                    )
                                                    : (
                                                        <Typography.Link onClick={runAction} tabIndex={2}>
                                                            {ResendSmsLabel}
                                                        </Typography.Link>
                                                    )
                                            )
                                        }}
                                    </CountDownTimer>

                                    <Typography.Link onClick={openModal} tabIndex={3}>
                                        {smsNotDeliveredMessage}
                                    </Typography.Link>
                                </Space>
                            </Col>
                        </Row>
                    </ResponsiveCol>
                </Row>
            </Form>

            <Modal
                open={isOpenProblemsModal}
                title={problemsModalTitle}
                width='small'
                onCancel={closeModal}
                footer={
                    <Button type='primary' onClick={closeModal}>
                        {checkPhoneLabel}
                    </Button>
                }
            >
                <Space
                    direction='vertical'
                    size={0}
                >
                    <Typography.Text type='secondary'>
                        {instructionStepCheckPhone}
                    </Typography.Text>
                    {
                        hasSupportTelegramChat && (
                            <Typography.Text type='secondary'>
                                {instructionStepSupportTelegramChat}
                            </Typography.Text>
                        )
                    }
                </Space>
            </Modal>
        </>
    )
}
