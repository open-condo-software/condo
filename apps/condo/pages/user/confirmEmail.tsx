import {
    type CompleteConfirmEmailActionMutation,
    type CompleteConfirmPhoneActionMutation,
    useCompleteConfirmEmailActionMutation,
} from '@app/condo/gql'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { HCaptchaProvider, useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { PageComponentType } from '@condo/domains/common/types'
import { base64UrlDecode } from '@condo/domains/common/utils/base64.utils'
import { encryptionManager } from '@condo/domains/common/utils/encryption'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { VERIFY_USER_EMAIL_MESSAGE_TYPE } from '@condo/domains/notification/constants/constants'

import type { GetServerSideProps } from 'next'


type ConfirmEmailPageProps = {
    messageType?: string
    secretCode?: string
    token?: string
}

const ConfirmEmailPage: PageComponentType<ConfirmEmailPageProps> = ({ messageType, secretCode, token }) => {
    const [loading, setLoading] = useState<boolean>(false)
    const { executeCaptcha } = useHCaptcha()

    const router = useRouter()

    const errorHandler = useMutationErrorHandler()

    const [completeConfirmEmailMutation] = useCompleteConfirmEmailActionMutation({
        onError: errorHandler,
    })

    const handleVerifyCode = useCallback(async () => {
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
                if (messageType === VERIFY_USER_EMAIL_MESSAGE_TYPE) {
                    await updateQuery(router, {
                        newRoute: '/user/verifyEmail',
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
            }
        } catch (error) {
            console.error(error)
        }
    }, [loading, messageType, secretCode, token])

    useEffect(() => {
        if (loading) return
        if (!messageType || !secretCode || !token) {
            return
        }

        handleVerifyCode()
    }, [messageType, secretCode, token])

    // TODO(DOMA-12179): add logic ConfirmEmail
    console.log({
        messageType, secretCode, token,
    })

    if (!messageType || !secretCode || !token) {
        return <>Failed to confirm email</>
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
