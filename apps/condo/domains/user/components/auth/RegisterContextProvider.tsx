import { isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import React, { createContext, Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { useLazyQuery } from '@open-condo/next/apollo'

import { GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY } from '@condo/domains/user/gql'

interface IRegisterContext {
    handleReCaptchaVerify: (action: string) => Promise<string>
    token: string
    setToken: Dispatch<SetStateAction<string>>
    phone: string
    setPhone: Dispatch<SetStateAction<string>>
    tokenError: Error
    setTokenError: Dispatch<SetStateAction<Error>>
    isConfirmed: boolean
}

export const RegisterContext = createContext<IRegisterContext>({
    handleReCaptchaVerify: () => null,
    token: '',
    setToken: () => null,
    phone: '',
    setPhone: () => null,
    tokenError: null,
    setTokenError: (error) => null,
    isConfirmed: false,
})

export const RegisterContextProvider = ({ children }): React.ReactElement => {
    const { query: { token: queryToken } } = useRouter()
    const [token, setToken] = useState(queryToken as string)
    const [phone, setPhone] = useState('')
    const [tokenError, setTokenError] = useState<Error | null>(null)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const { executeRecaptcha } = useGoogleReCaptcha()

    const handleReCaptchaVerify = useCallback(async (action) => {
        if (executeRecaptcha) {
            return await executeRecaptcha(action)
        }
    }, [executeRecaptcha])

    const [loadTokenInfo] = useLazyQuery(GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY, {
        onError: error => {
            setTokenError(error)
        },
        onCompleted: ({ result: { phone, isPhoneVerified } }) => {
            setPhone(phone)
            setIsConfirmed(isPhoneVerified)
            setTokenError(null)
        },
    })

    useEffect(() => {
        if (!isEmpty(queryToken)) {
            handleReCaptchaVerify('get_confirm_phone_token_info').then(captcha => {
                if (captcha) {
                    loadTokenInfo({ variables: { data: { token: queryToken, captcha } } })
                }
            })
        } else {
            setPhone(phone) // NOSONAR
            setIsConfirmed(false)
        }
    }, [queryToken, handleReCaptchaVerify, loadTokenInfo, phone])

    return (
        <RegisterContext.Provider
            value={{
                phone,
                setPhone,
                token,
                setToken,
                tokenError,
                setTokenError,
                isConfirmed,
                handleReCaptchaVerify,
            }}
        >
            {children}
        </RegisterContext.Provider>
    )
}