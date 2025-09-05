import { useUpdateUserMutation, useChangeUserEmailMutation } from '@app/condo/gql'
import { Col, Form, Row } from 'antd'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Typography, Input } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import Prompt from '@condo/domains/common/components/Prompt'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { normalizeEmail } from '@condo/domains/common/utils/mail'
import { EMAIL_ALREADY_REGISTERED_ERROR } from '@condo/domains/user/constants/errors'
import { PHONE_TYPE } from '@condo/domains/user/constants/identifiers'

import { useSudoToken } from './SudoTokenProvider'


const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 9,
    },
    wrapperCol: {
        span: 15,
    },
    style: {
        maxWidth: '453px',
    },
}

const RESET_PASSWORD_URL = '/auth/forgot'

const { publicRuntimeConfig: { inviteRequiredFields } } = getConfig()

const isEmailEditable = Array.isArray(inviteRequiredFields)
    && inviteRequiredFields.length === 1
    && inviteRequiredFields.includes(PHONE_TYPE)

export const UserProfileForm: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const FullNameLabel = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const PasswordLabel = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const MinLengthError = intl.formatMessage({ id: 'field.ClientName.minLengthError' })
    const MaxLengthError = intl.formatMessage({ id: 'field.ClientName.maxLengthError' })
    const ProfileUpdateTitle = intl.formatMessage({ id: 'profile.Update' })
    const EmailIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsAlreadyRegistered' })
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePassword' })
    const PromptTitle = intl.formatMessage({ id: 'form.prompt.title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'form.prompt.message' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })

    const { user } = useAuth()

    const { getSudoTokenWithModal, clearSudoToken } = useSudoToken()

    const [form] = Form.useForm()
    const errorHandler = useMutationErrorHandler({
        form,
        typeToFieldMapping: {
            WRONG_EMAIL_VALUE: 'email',
        },
    })
    
    const [updateUserMutation] = useUpdateUserMutation({
        onError: errorHandler,
    })
    const [changeUserEmailMutation] = useChangeUserEmailMutation({
        onError: (error) => {
            const isExpiredToken = error?.graphQLErrors?.some((gqlError) => gqlError.extensions?.type === 'TOKEN_NOT_FOUND')
            const isExistsEmail = error?.graphQLErrors?.some(gqlError => (gqlError.extensions?.message as string)?.includes(EMAIL_ALREADY_REGISTERED_ERROR))
            if (isExistsEmail) {
                form.setFields([{
                    name: 'email',
                    errors: [EmailIsAlreadyRegisteredMsg],
                }])
                throw error
            } else if (isExpiredToken) {
                // get new sudo token
            } else {
                errorHandler(error)
            }
        },
    })

    const formAction = useCallback(async (formValues) => {
        const userPayload = {
            name: formValues?.name?.trim() || '',
        }
        if (userPayload?.name && userPayload?.name !== user.name) {
            const res = await updateUserMutation({
                variables: {
                    id: user.id,
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        ...userPayload,
                    },
                },
            })

            if (res.errors) {
                throw new Error('cannot change user data')
            }
        }

        if (isEmailEditable) {
            const newEmail = normalizeEmail(formValues?.email) || null
            const oldEmail = user?.email || null

            if (newEmail !== oldEmail) {
                const changeUserEmailWithSudoToken = async () => {
                    const sudoToken = await getSudoTokenWithModal({
                        phone: user.phone,
                    })

                    return await changeUserEmailMutation({
                        variables: {
                            data: {
                                dv: 1,
                                sender: getClientSideSenderInfo(),
                                newEmail,
                                token: sudoToken,
                            },
                        },
                    })
                }

                const res = await changeUserEmailWithSudoToken()

                if (res.errors || res?.data?.result?.status !== 'ok') {
                    // @ts-ignore
                    const isExpiredSudoToken = res?.errors?.graphQLErrors?.some((gqlError) => gqlError?.extensions?.type === 'TOKEN_NOT_FOUND')
                    // @ts-ignore
                    const isEmailChangingFailed = res?.errors?.graphQLErrors?.some((gqlError) => gqlError?.extensions?.type === 'OPERATION_FAILED')
                    if (isExpiredSudoToken || isEmailChangingFailed) {
                        clearSudoToken()
                        const res2 = await changeUserEmailWithSudoToken()
                        if (res2.errors) {
                            throw new Error('cannot change email')
                        }
                    } else {
                        throw new Error('cannot change email')
                    }
                }
            }
        }

        await router.push('/user')
    }, [changeUserEmailMutation, clearSudoToken, getSudoTokenWithModal, router, updateUserMutation, user?.email, user?.id, user?.name, user?.phone])

    const onCancel = useCallback(() => {
        router.push('/user')
    }, [router])

    const { requiredValidator, emailValidator, changeMessage, minLengthValidator, maxLengthValidator } = useValidations()
    const minClientNameRule = changeMessage(minLengthValidator(2), MinLengthError)
    const maxClientNameRule = changeMessage(maxLengthValidator(100), MaxLengthError)
    const validations = {
        email: [emailValidator],
        name: [requiredValidator, minClientNameRule, maxClientNameRule],
    }

    const initialValues = useMemo(() => ({
        name: user?.name,
        email: user?.email,
    }), [user])

    return (
        <>
            <FormWithAction
                formInstance={form}
                colon={false}
                action={formAction}
                initialValues={initialValues}
                layout='horizontal'
                validateTrigger={['onBlur', 'onSubmit']}
            >
                {({ handleSave, isLoading, form }) => {
                    return (
                        <>
                            <Prompt
                                title={PromptTitle}
                                form={form}
                                handleSave={handleSave}
                            >
                                <Typography.Paragraph>
                                    {PromptHelpMessage}
                                </Typography.Paragraph>
                            </Prompt>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Typography.Title level={1}>
                                        {ProfileUpdateTitle}
                                    </Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        {...INPUT_LAYOUT_PROPS}
                                        labelAlign='left'
                                        name='name'
                                        label={FullNameLabel}
                                        rules={validations.name}
                                    >
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                {
                                    isEmailEditable && (
                                        <Col span={24}>
                                            <Form.Item
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign='left'
                                                name='email'
                                                label={EmailLabel}
                                                rules={validations.email}
                                            >
                                                <Input placeholder={ExampleEmailMessage}/>
                                            </Form.Item>
                                        </Col>
                                    )
                                }
                                <Col span={24}>
                                    <Form.Item {...INPUT_LAYOUT_PROPS} labelAlign='left' label={PasswordLabel}>
                                        <Link href={RESET_PASSWORD_URL}>
                                            <Typography.Link href={RESET_PASSWORD_URL}>
                                                {ChangePasswordLabel}
                                            </Typography.Link>
                                        </Link>
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <ActionBar
                                        actions={[
                                            <Button
                                                key='submit'
                                                onClick={handleSave}
                                                type='primary'
                                                loading={isLoading}
                                            >
                                                {ApplyChangesMessage}
                                            </Button>,
                                            <Button
                                                key='cancel'
                                                type='secondary'
                                                onClick={onCancel}
                                            >
                                                {CancelLabel}
                                            </Button>,
                                        ]}
                                    />
                                </Col>
                            </Row>
                        </>
                    )
                }}
            </FormWithAction>
        </>
    )
}
