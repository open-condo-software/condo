import {
    useVerifyUserEmailMutation,
    useUpdateUserMutation, useStartConfirmEmailActionMutation,
} from '@app/condo/gql'
import { ConfirmEmailActionMessageType } from '@app/condo/schema'
import { Row } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { HCaptchaProvider, useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { Loader } from '@condo/domains/common/components/Loader'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { PageComponentType } from '@condo/domains/common/types'
import { OutdatedLinkPoster } from '@condo/domains/user/components/OutdatedLinkPoster'
import { SuccessfulEmailVerificationPoster } from '@condo/domains/user/components/SuccessfulEmailVerificationPoster'


const { publicRuntimeConfig: { verifyUserEmailWithMarketingConsentEnabled } } = getConfig()

type ConfirmEmailPageProps = {
    messageType?: string
    secretCode?: string
    token?: string
}

const VerifyEmailPage: PageComponentType<ConfirmEmailPageProps> = () => {
    const router = useRouter()
    const { query: { token: tokenFromQuery } } = router
    const queryToken = typeof tokenFromQuery === 'string' ? tokenFromQuery : ''

    const [loading, setLoading] = useState<boolean>(false)
    const [isEmailResent, setIsEmailResent] = useState<boolean>(false)
    const [step, setStep] = useState<'verification' | 'error' | 'done'>(queryToken ? 'verification' : 'error')

    const { user } = useAuth()

    const errorHandler = useMutationErrorHandler()

    const [verifyUserEmailMutation] = useVerifyUserEmailMutation({
        onError: errorHandler,
    })
    const [updateUserMutation] = useUpdateUserMutation({
        onError: errorHandler,
    })

    const { executeCaptcha } = useHCaptcha()

    const [startConfirmEmailActionMutation] = useStartConfirmEmailActionMutation({
        onError: errorHandler,
    })

    const handleUpdateMarketingConsent = useCallback(async () => {
        try {
            if (!user?.id) throw new Error('User.id not empty')

            const sender = getClientSideSenderInfo()

            const res = await updateUserMutation({
                variables: {
                    id: user.id,
                    data: {
                        dv: 1,
                        sender,
                        hasMarketingConsent: true,
                    },
                },
            })

            if (res.errors) {
                throw new Error('Cannot set hasMarketingConsent to true')
            }
        } catch (error) {
            console.error(error)
        }
    }, [user?.id])

    const handleVerifyUserEmail = useCallback(async () => {
        if (loading) return

        setLoading(true)

        try {
            const sender = getClientSideSenderInfo()

            const res = await verifyUserEmailMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender,
                        confirmEmailToken: queryToken,
                    },
                },
            })

            if (!res.errors && res?.data?.result?.status === 'ok') {
                if (verifyUserEmailWithMarketingConsentEnabled) {
                    await handleUpdateMarketingConsent()
                }

                setStep('done')
            } else {
                throw new Error('Cannot verify email')
            }
        } catch (error) {
            console.error(error)
            setStep('error')
        }
    }, [queryToken, loading])

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
                    messageType: ConfirmEmailActionMessageType.VerifyUserEmail,
                },
            },
        })
    }, [user?.email])

    useEffect(() => {
        if (loading) return
        if (!queryToken) return

        handleVerifyUserEmail()
    }, [queryToken])

    useEffect(() => {
        if (step !== 'error') return
        if (isEmailResent) return
        setIsEmailResent(true)

        handleResendConfirmEmailAction()
    }, [step])

    if (step === 'error') {
        return <OutdatedLinkPoster />
    }

    if (step === 'done') {
        return (
            <SuccessfulEmailVerificationPoster
                onContinueClick={async () => {
                    await router.replace('/')
                }}
            />
        )
    }

    return (
        <Row justify='center'>
            <Loader size='large' />
        </Row>
    )
}

VerifyEmailPage.requiredAccess = AuthRequired

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <HCaptchaProvider>
            {children}
        </HCaptchaProvider>
    )
}
VerifyEmailPage.container = Layout

export default VerifyEmailPage
