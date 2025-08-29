import {
    useVerifyUserEmailMutation,
    useUpdateUserMutation,
} from '@app/condo/gql'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { HCaptchaProvider } from '@condo/domains/common/components/HCaptcha'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { PageComponentType } from '@condo/domains/common/types'


type ConfirmEmailPageProps = {
    messageType?: string
    secretCode?: string
    token?: string
}

const ConfirmEmailPage: PageComponentType<ConfirmEmailPageProps> = () => {
    const [loading, setLoading] = useState<boolean>(false)

    const { user } = useAuth()

    const router = useRouter()
    const { query: { token: tokenFromQuery } } = router
    const queryToken = typeof tokenFromQuery === 'string' ? tokenFromQuery : ''

    const errorHandler = useMutationErrorHandler()

    const [verifyUserEmailMutation] = useVerifyUserEmailMutation({
        onError: errorHandler,
    })
    const [updateUserMutation] = useUpdateUserMutation({
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

            throw error
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
                await handleUpdateMarketingConsent()
            } else {
                throw new Error('Cannot verify email')
            }
        } catch (error) {
            console.error(error)
        }
    }, [queryToken])

    useEffect(() => {
        if (loading) return
        if (!queryToken) return

        handleVerifyUserEmail()
    }, [queryToken])

    // TODO(DOMA-12179): add logic ConfirmEmail
    console.log({
        queryToken,
    })

    if (!queryToken) {
        return <>Failed to verify email</>
    }

    return <>Loading...</>
}

ConfirmEmailPage.requiredAccess = AuthRequired

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <HCaptchaProvider>
            {children}
        </HCaptchaProvider>
    )
}
ConfirmEmailPage.container = Layout

export default ConfirmEmailPage
