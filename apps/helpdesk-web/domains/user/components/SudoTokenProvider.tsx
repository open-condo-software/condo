import { useGenerateSudoTokenMutation, GenerateSudoTokenMutationVariables } from '@app/condo/gql'
import { UserTypeType } from '@app/condo/schema'
import { Form, Row, Col } from 'antd'
import Link from 'next/link'
import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Input, Modal, Typography, type TypographyLinkProps } from '@open-condo/ui'

import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { CREDENTIAL_VALIDATION_FAILED } from '@condo/domains/user/constants/errors'


const RESET_PASSWORD_URL = '/auth/forgot?next=/user/update'

type UserIdentifierType = Pick<GenerateSudoTokenMutationVariables['data']['user'], 'email' | 'phone'>
type GetSudoTokenForceDataType = {
    user: Pick<GenerateSudoTokenMutationVariables['data']['user'], 'email' | 'phone'>
    authFactors: Pick<GenerateSudoTokenMutationVariables['data']['authFactors'], 'password'>
}
type SudoTokenContextType = {
    getSudoTokenWithModal: (userIdentifier: UserIdentifierType) => Promise<string>
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

export const SudoTokenProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const intl = useIntl()
    const Email = intl.formatMessage({ id: 'Email' }).toLowerCase()
    const Phone = intl.formatMessage({ id: 'Phone' }).toLowerCase()
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePassword' })
    const PasswordTitle = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.title' })
    const ChangeEmailWidthPasswordDescription = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.description' }, { identifier: Email })
    const ChangePhoneWidthPasswordDescription = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.description' }, { identifier: Phone })
    const Done = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.done' })
    const WrongPasswordMessage = intl.formatMessage({ id: 'component.SudoTokenProvider.modal.password.error.wrongPassword' })

    const sudoTokenRef = useRef<string>(null)
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
    const resolveRef = useRef<(value: (string)) => void>(null)
    const rejectRef = useRef<(reason: Error) => void>(null)
    const currentPromiseRef = useRef<Promise<string> | null>(null)
    const userIdentifierRef = useRef<UserIdentifierType>()
    const [passwordDescription, setPasswordDescription] = useState<string>(ChangeEmailWidthPasswordDescription)

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
            } else {
                const gqlError = error?.graphQLErrors?.[0]
                const errorMessage = (gqlError?.extensions?.messageForUser || gqlError?.extensions?.message) as string
                form.setFields([{
                    name: 'password',
                    errors: [errorMessage],
                }])
            }
        },
    })

    const openModal = useCallback(() => {
        setIsModalVisible(true)
    }, [])

    const closeModal = useCallback(() => {
        form.resetFields()
        setIsModalVisible(false)
    }, [form])

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
                    },
                },
            },
        })

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
    }, [closeModal, executeCaptcha, generateSudoTokenMutation])

    const handleCancel = useCallback(() => {
        resolveRef.current = null
        if (rejectRef.current) {
            rejectRef.current(new Error('cancelled'))
            rejectRef.current = null
        }
        currentPromiseRef.current = null

        closeModal()
    }, [closeModal])

    const getSudoTokenWithModal: SudoTokenContextType['getSudoTokenWithModal'] = useCallback((userIdentifier) => {
        if (currentPromiseRef.current) {
            return currentPromiseRef.current
        }

        if (sudoTokenRef.current) {
            return Promise.resolve(sudoTokenRef.current)
        }

        setPasswordDescription(userIdentifier.phone ? ChangeEmailWidthPasswordDescription : ChangePhoneWidthPasswordDescription)
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
                    title={PasswordTitle}
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
                        <Col span={24}>
                            <Alert
                                type='warning'
                                showIcon
                                description={passwordDescription}
                            />
                        </Col>

                        <Col span={24}>
                            <Row gutter={[0, 24]}>
                                <Col span={24}>
                                    <Form.Item
                                        name='password'
                                        rules={[requiredValidator]}
                                    >
                                        <Input.Password />
                                    </Form.Item>
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
            </Form>
        </SudoTokenContext.Provider>
    )
}
