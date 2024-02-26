import { Col, Form, Row } from 'antd'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Input, Button, Typography } from '@open-condo/ui'
import type { PhoneInputProps } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { INVALID_PHONE } from '@dev-api/domains/user/constants/errors'

import styles from './PhoneInputStep.module.css'

import { useStartConfirmPhoneActionMutation, StartConfirmPhoneActionMutation } from '@/lib/gql'

const FULL_SPAN_COL = 24
const START_CONFIRM_PHONE_ACTION_ERRORS_TO_FIELDS_MAP = {
    [INVALID_PHONE]: 'phone',
}

type PhoneFormValues = {
    phone: string
}

export type PhoneInputStepProps = {
    onComplete: (values: { actionId: string, phone: string, formattedPhone?: string }) => void
}

export const PhoneInputStep: React.FC<PhoneInputStepProps> = ({ onComplete }) => {
    const intl = useIntl()
    const PhoneLabel = intl.formatMessage({ id: 'global.authForm.items.phone.label' })
    const SignUpButtonLabel = intl.formatMessage({ id: 'global.actions.signUp' })
    const PrivacyPolicyText = intl.formatMessage({ id: 'global.registerForm.info.personalDataProcessing.privacyPolicy' })
    const UserAgreementText = intl.formatMessage({ id: 'global.registerForm.info.personalDataProcessing.userAgreement' })
    const ConsentText = intl.formatMessage({ id: 'global.registerForm.info.personalDataProcessing.consent' })
    const PersonalDataProcessingMessage = intl.formatMessage({ id: 'global.registerForm.info.personalDataProcessing.message' }, {
        signUpButton: SignUpButtonLabel,
        userAgreementLink: (
            <Typography.Link href='/user-docs/ru/agreement.pdf' target='_blank'>{UserAgreementText}</Typography.Link>
        ),
        privacyPolicyLink: (
            <Typography.Link href='/user-docs/ru/policy.pdf' target='_blank'>{PrivacyPolicyText}</Typography.Link>
        ),
        consentLink: (
            <Typography.Link href='/user-docs/ru/pdpc.pdf' target='_blank'>{ConsentText}</Typography.Link>
        ),
    })
    const [formattedPhone, setFormattedPhone] = useState<string | undefined>(undefined)
    const { phoneFormatValidator } = useValidations()
    const [form] = Form.useForm()

    const onPhoneInputChange = useCallback<Required<PhoneInputProps>['onChange']>((value, opts, evt, maskedValue) => {
        setFormattedPhone(maskedValue)
    }, [])

    const onStartConfirmPhoneActionError = useMutationErrorHandler({
        form,
        typeToFieldMapping: START_CONFIRM_PHONE_ACTION_ERRORS_TO_FIELDS_MAP,
    })
    const onStartConfirmPhoneActionCompleted = useCallback((data: StartConfirmPhoneActionMutation) => {
        if (data.startConfirmPhoneAction?.actionId && data.startConfirmPhoneAction.phone) {
            onComplete({
                phone: data.startConfirmPhoneAction.phone,
                actionId: data.startConfirmPhoneAction.actionId,
                formattedPhone: formattedPhone,
            })
        }
    }, [onComplete, formattedPhone])

    const [startConfirmPhoneActionMutation] = useStartConfirmPhoneActionMutation({
        onCompleted: onStartConfirmPhoneActionCompleted,
        onError: onStartConfirmPhoneActionError,
    })

    const startConfirmPhoneAction = useCallback((values: PhoneFormValues) => {
        const data = {
            ...values,
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        startConfirmPhoneActionMutation({ variables: { data } })
    }, [startConfirmPhoneActionMutation])

    return (
        <Form
            name='register-phone'
            layout='vertical'
            requiredMark={false}
            form={form}
            onFinish={startConfirmPhoneAction}
        >
            <Row>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='phone' label={PhoneLabel} rules={[phoneFormatValidator]} required>
                        <Input.Phone onChange={onPhoneInputChange}/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    <Typography.Paragraph type='secondary' size='small'>
                        {PersonalDataProcessingMessage}
                    </Typography.Paragraph>
                </Col>
                <Col span={FULL_SPAN_COL} className={styles.submitButtonCol}>
                    <Button type='primary' block htmlType='submit'>
                        {SignUpButtonLabel}
                    </Button>
                </Col>
            </Row>
        </Form>
    )
}