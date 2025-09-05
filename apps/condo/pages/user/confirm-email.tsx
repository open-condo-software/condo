import {
    useCompleteConfirmEmailActionMutation,
    useStartConfirmEmailActionMutation,
} from '@app/condo/gql'
import { ConfirmEmailActionMessageType } from '@app/condo/schema'
import { Row } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { Loader } from '@condo/domains/common/components/Loader'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { PageComponentType } from '@condo/domains/common/types'
import { base64UrlDecode } from '@condo/domains/common/utils/base64.utils'
import { encryptionManager } from '@condo/domains/common/utils/encryption'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { OutdatedLinkPoster } from '@condo/domains/user/components/OutdatedLinkPoster'

import type { GetServerSideProps } from 'next'


type ConfirmEmailPageProps = {
    messageType?: string
    secretCode?: string
    token?: string
}

const ALLOWED_MESSAGE_TYPES = [
    ConfirmEmailActionMessageType.VerifyUserEmail,
]

const ConfirmEmailPage: PageComponentType<ConfirmEmailPageProps> = ({ messageType, secretCode, token }) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [step, setStep] = useState<'error' | 'completion'>((messageType && secretCode && token) ? 'completion' : 'error')
    const [isEmailResent, setIsEmailResent] = useState<boolean>(false)

    const { executeCaptcha } = useHCaptcha()
    const { user } = useAuth()

    const router = useRouter()

    const errorHandler = useMutationErrorHandler()

    const [completeConfirmEmailMutation] = useCompleteConfirmEmailActionMutation({
        onError: errorHandler,
    })

    const [startConfirmEmailActionMutation] = useStartConfirmEmailActionMutation({
        onError: errorHandler,
    })

    const handleCompleteConfirmAction = useCallback(async () => {
        if (loading) return

        setLoading(true)

        try {
            const sender = getClientSideSenderInfo()
            const captcha = await executeCaptcha()

            const res = await completeConfirmEmailMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        captcha,
                        token,
                        secretCode,
                    },
                },
            })

            if (!res.errors && res?.data?.result?.status === 'ok') {
                if (messageType === ConfirmEmailActionMessageType.VerifyUserEmail) {
                    await updateQuery(router, {
                        newRoute: '/user/verify-email',
                        newParameters: {
                            token,
                        },
                    }, {
                        resetOldParameters: true,
                        routerAction: 'replace',
                    })
                } else {
                    throw new Error(`Unexpected messageType: "${messageType}"`)
                }
            } else {
                throw new Error('Cannot complete email action!')
            }
        } catch (error) {
            console.error(error)
            setStep('error')
        }
    }, [loading, messageType, secretCode, token])

    const handleResendConfirmEmailAction = useCallback(async () => {
        if (!user?.email) return

        const sender = getClientSideSenderInfo()
        const captcha = await executeCaptcha()

        await startConfirmEmailActionMutation({
            variables: {
                data: {
                    dv: 1,
                    sender,
                    captcha,
                    email: user.email,
                    messageType: messageType as ConfirmEmailActionMessageType,
                },
            },
        })
    }, [user?.email])

    useEffect(() => {
        if (loading) return
        if (step !== 'completion') return

        handleCompleteConfirmAction()
    }, [messageType, secretCode, token])

    useEffect(() => {
        if (!ALLOWED_MESSAGE_TYPES.includes(messageType as ConfirmEmailActionMessageType)) return
        if (step !== 'error') return
        if (isEmailResent) return

        setIsEmailResent(true)

        handleResendConfirmEmailAction()
    }, [step])

    if (step === 'error') {
        return <OutdatedLinkPoster />
    }

    return (
        <Row justify='center'>
            <Loader size='large' />
        </Row>
    )
}

ConfirmEmailPage.requiredAccess = AuthRequired

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>{children}</>
    )
}
ConfirmEmailPage.container = Layout

export default ConfirmEmailPage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { query } = context
    const { token: encodedTokenInBase64 = '' } = query

    let data = {} as any
    try {
        if (encodedTokenInBase64 && typeof encodedTokenInBase64 === 'string') {
            const encodedToken = base64UrlDecode(encodedTokenInBase64)
            const decodedTokenInString = encryptionManager.decrypt(encodedToken)
            data = JSON.parse(decodedTokenInString)
        }
    } catch (error) {
        console.error('Unable to read email verification token!')
        console.error(error)
    }

    return {
        props: {
            messageType: data?.messageType || null,
            secretCode: data?.secretCode || null,
            token: data?.token || null,
        },
    }
}
