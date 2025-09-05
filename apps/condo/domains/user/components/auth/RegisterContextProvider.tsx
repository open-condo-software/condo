import {
    useGetPhoneByConfirmPhoneActionTokenLazyQuery,
    useGetEmailByConfirmEmailActionTokenLazyQuery,
} from '@app/condo/gql'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { createContext, Dispatch, SetStateAction, useEffect, useState, useContext, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'

import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { normalizeUserIdentifier } from '@condo/domains/user/utils/helpers'
import { detectTokenTypeSafely, TOKEN_TYPES } from '@condo/domains/user/utils/tokens'


interface IRegisterContext {
    token: string | null
    setToken: Dispatch<SetStateAction<string | null>>
    identifier: string | null
    setIdentifier: Dispatch<SetStateAction<string>>
    identifierType: 'phone' | 'email' | null
    tokenError: Error | null
    setTokenError: Dispatch<SetStateAction<Error | null>>
    isConfirmed: boolean
}

export const RegisterContext = createContext<IRegisterContext>({
    token: '',
    setToken: () => null,
    identifier: '',
    setIdentifier: () => null,
    identifierType: null,
    tokenError: null,
    setTokenError: () => null,
    isConfirmed: false,
})

export const useRegisterContext = (): IRegisterContext => useContext(RegisterContext)

export const RegisterContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { executeCaptcha } = useHCaptcha()

    const { query: { token: tokenFromQuery } } = useRouter()
    const queryToken = typeof tokenFromQuery === 'string' ? tokenFromQuery : ''

    const [token, setToken] = useState<string | null>(queryToken)
    const [identifier, setIdentifier] = useState<string>('')
    const [tokenError, setTokenError] = useState<Error | null>(null)
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false)
    const identifierType = useMemo(() => normalizeUserIdentifier(identifier).type, [identifier])

    const [loadPhoneTokenInfo] = useGetPhoneByConfirmPhoneActionTokenLazyQuery({
        onError: (error) => {
            setTokenError(error)
        },
        onCompleted: ({ result: { phone, isPhoneVerified } }) => {
            setIdentifier(phone)
            setIsConfirmed(isPhoneVerified)
            setTokenError(null)
        },
    })

    const [loadEmailTokenInfo] = useGetEmailByConfirmEmailActionTokenLazyQuery({
        onError: (error) => {
            setTokenError(error)
        },
        onCompleted: ({ result: { email, isEmailVerified } }) => {
            setIdentifier(email)
            setIsConfirmed(isEmailVerified)
            setTokenError(null)
        },
    })

    useEffect(() => {
        if (!isEmpty(queryToken)) {
            executeCaptcha().then(captcha => {
                if (captcha) {
                    const { tokenType, error } = detectTokenTypeSafely(queryToken)
                    if (error) {
                        setTokenError(error)
                    } else if (tokenType === TOKEN_TYPES.CONFIRM_PHONE) {
                        loadPhoneTokenInfo({
                            variables: {
                                data: {
                                    token: queryToken,
                                    captcha,
                                },
                            },
                        })
                    } else if (tokenType === TOKEN_TYPES.CONFIRM_EMAIL) {
                        loadEmailTokenInfo({
                            variables: {
                                data: {
                                    token: queryToken,
                                    captcha,
                                    dv: 1,
                                    sender: getClientSideSenderInfo(),
                                },
                            },
                        })
                    }
                }
            })
        } else {
            setIsConfirmed(false)
        }
    }, [queryToken, executeCaptcha, loadPhoneTokenInfo, identifier, loadEmailTokenInfo])

    return (
        <RegisterContext.Provider
            value={{
                identifier,
                setIdentifier,
                identifierType,
                token,
                setToken,
                tokenError,
                setTokenError,
                isConfirmed,
            }}
        >
            {children}
        </RegisterContext.Provider>
    )
}