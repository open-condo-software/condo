import { useGenerateSudoTokenMutation, GenerateSudoTokenMutationVariables } from '@app/condo/gql'
import { UserTypeType } from '@app/condo/schema'
import { Form } from 'antd'
import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { Alert, Button, Input, Modal, Space, Typography } from '@open-condo/ui'

import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { CREDENTIAL_VALIDATION_FAILED } from '@condo/domains/user/constants/errors'


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
    const sudoTokenRef = useRef<string>(null)
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
    const resolveRef = useRef<(value: (string)) => void>(null)
    const rejectRef = useRef<(reason?: any) => void>(null)
    const currentPromiseRef = useRef<Promise<string> | null>(null)
    const userIdentifierRef = useRef<UserIdentifierType>()

    const { executeCaptcha } = useHCaptcha()
    const { requiredValidator } = useValidations()
    const [form] = Form.useForm()

    const [generateSudoTokenMutation] = useGenerateSudoTokenMutation({
        onError: (error) => {
            if (error?.graphQLErrors?.some(gqlError => gqlError.extensions?.type === CREDENTIAL_VALIDATION_FAILED)) {
                form.setFields([{
                    name: 'password',
                    errors: ['Неверный пароль'],
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
                    title='Введите пароль'
                    onCancel={handleCancel}
                    footer={(
                        <Button
                            type='primary'
                            onClick={form.submit}
                        >
                            Ok
                        </Button>
                    )}
                >
                    <Space size={40} direction='vertical'>
                        <Alert
                            type='warning'
                            showIcon
                            description='Чтобы изменить email, введите пароль к учетной записи на платформе Doma.ai'
                        />
                        <Space size={24} direction='vertical'>
                            <Form.Item
                                name='password'
                                rules={[requiredValidator]}
                            >
                                <Input.Password />
                            </Form.Item>
                            <Typography.Link>Сбросить пароль</Typography.Link>
                        </Space>
                    </Space>
                </Modal>
            </Form>
        </SudoTokenContext.Provider>
    )
}
