import { isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import React, { createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useLazyQuery } from '@apollo/client'
import { GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY } from '@condo/domains/user/gql'
import cookie from 'js-cookie'

interface IRegisterContext {
    handleReCaptchaVerify: (action: string) => Promise<string>
    token: string
    setToken: Dispatch<SetStateAction<string>>
    tokenLoading: boolean
    phone: string
    setPhone: Dispatch<SetStateAction<string>>
    tokenError: Error
    setTokenError: Dispatch<SetStateAction<Error>>
    isConfirmed: boolean
}

export const RegisterContext = createContext<IRegisterContext>({
    handleReCaptchaVerify: (action: string) => null,
    token: '',
    setToken: (token) => null,
    tokenLoading: true,
    phone: '',
    setPhone: (phone) => null,
    tokenError: null,
    setTokenError: (error) => null,
    isConfirmed: false,
})
const REGISTER_TOKEN_COOKIE_KEY = 'confirmedRegisterToken'

export const RegisterContextProvider = ({ children }): React.ReactElement => {
    const { query: { token: queryToken } } = useRouter()
    const [token, setToken] = useState(queryToken as string)
    const [phone, setPhone] = useState('')
    const [tokenLoading, setTokenLoading] = useState(true)
    const [tokenError, setTokenError] = useState<Error | null>(null)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const { executeRecaptcha } = useGoogleReCaptcha()

    const handleReCaptchaVerify = useCallback(async (action) => {
        if (executeRecaptcha) {
            const userToken = await executeRecaptcha(action)
            return userToken
        }
    }, [executeRecaptcha])

    const [loadTokenInfo] = useLazyQuery(GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY, {
        onError: error => {
            setTokenError(error)
            setTokenLoading(false)
        },
        onCompleted: ({ result: { phone, isPhoneVerified } }) => {
            setPhone(phone)
            setIsConfirmed(isPhoneVerified)
            setTokenError(null)
            setTokenLoading(false)
            console.log('token', token, 'loaded, verified?', isPhoneVerified)
        },
    })

    useEffect(() => {
        if (!token) {
            cookie.remove(REGISTER_TOKEN_COOKIE_KEY)
        }
        else {
            cookie.set(REGISTER_TOKEN_COOKIE_KEY, token)
        }
    }, [token])

    useEffect(() => {
        const cookieToken = cookie.get(REGISTER_TOKEN_COOKIE_KEY)
        const tokenToCheck = queryToken ?? cookieToken
        console.log('loading token', queryToken, cookieToken)
        if (!isEmpty(tokenToCheck)) {
            handleReCaptchaVerify('get_confirm_phone_token_info').then(captcha => {
                if (captcha) {
                    loadTokenInfo({ variables: { data: { token: tokenToCheck, captcha } } })
                }
            })
        } else {
            setPhone('')
            setIsConfirmed(false)
        }
    }, [queryToken, handleReCaptchaVerify, loadTokenInfo])

    return (
        <RegisterContext.Provider
            value={{
                phone,
                setPhone,
                token,
                setToken,
                tokenLoading,
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
export const useRegisterContext = () => useContext(RegisterContext)