import { isEmpty } from 'lodash'
import React, { createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useLazyQuery } from '@apollo/client'
import { GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY } from '@condo/domains/user/gql'
import { CAPTCHA_ACTIONS } from '@condo/domains/user/utils/captchaActions'
import { ConfirmIdentityPageStoreType } from './hooks'

interface IConfirmIdentityContext {
    handleReCaptchaVerify: (action: string) => Promise<string>
    token: string
    setToken: Dispatch<SetStateAction<string>>
    tokenLoading: boolean
    phone: string
    setPhone: Dispatch<SetStateAction<string>>
    tokenError: Error
    setTokenError: Dispatch<SetStateAction<Error>>
    isConfirmed: boolean
    setIsConfirmed: (isConfirmed: boolean) => void
}

export const ConfirmIdentityContext = createContext<IConfirmIdentityContext>({
    handleReCaptchaVerify: (action: string) => null,
    token: '',
    setToken: (token) => null,
    tokenLoading: true,
    phone: '',
    setPhone: (phone) => null,
    tokenError: null,
    setTokenError: (error) => null,
    isConfirmed: false,
    setIsConfirmed: (t) => void 0,
})
type ConfirmIdentityContextProviderConfiguration = React.PropsWithChildren<{
    resetView: () => void
    pageStore: ReturnType<ConfirmIdentityPageStoreType>
}>

export const ConfirmIdentityContextProvider = ({ children, pageStore, resetView }: ConfirmIdentityContextProviderConfiguration): React.ReactElement => {
    const [token, setToken] = useState<string>()
    const loadedTokenHandle = useRef<string>()
    const [phone, setPhone] = useState('')
    const [tokenLoading, setTokenLoading] = useState(true)
    const [tokenError, setTokenError] = useState<Error | null>(null)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const { executeRecaptcha } = useGoogleReCaptcha()
    const { loadToken, saveToken, forgetToken } = pageStore

    const handleReCaptchaVerify = useCallback(async (action) => {
        if (executeRecaptcha) {
            const userToken = await executeRecaptcha(action)
            return userToken
        }
        else {
            // TODO(mrfoxpro): why is this happens and how to avoid this
            console.warn('captcha was not loaded')
            setTokenLoading(false)
            resetView()
            return null
        }
    }, [executeRecaptcha, resetView])

    const [loadTokenInfo] = useLazyQuery(GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY, {
        onError: error => {
            console.log('token error', error)
            setTokenError(error)
            setTokenLoading(false)
            forgetToken()
        },
        onCompleted: ({ result: { phone, isPhoneVerified } }) => {
            setPhone(phone)
            setToken(loadedTokenHandle.current)
            setIsConfirmed(isPhoneVerified)
            setTokenError(null)
            console.log('token', token, 'loaded, verified?', isPhoneVerified)
            setTokenLoading(false)
        },
        fetchPolicy: 'network-only',
    })

    useEffect(() => { console.log('tokenLoading', tokenLoading) }, [tokenLoading])
    useEffect(() => {
        console.log('token changed', token)
        if (token?.length > 0) {
            saveToken(token)
        }
    }, [token])

    useEffect(() => {
        const tokenToVerify = loadToken<string>()
        if (!isEmpty(tokenToVerify)) {
            loadedTokenHandle.current = tokenToVerify
            console.log('loading token', tokenToVerify, CAPTCHA_ACTIONS.GET_CONFIRM_PHONE_TOKEN_INFO)
            handleReCaptchaVerify(CAPTCHA_ACTIONS.GET_CONFIRM_PHONE_TOKEN_INFO).then(captcha => {
                if (captcha) {
                    loadTokenInfo({ variables: { data: { token: tokenToVerify, captcha } } })
                }
                else console.log('captcha is undefined', captcha)
            })
        } else {
            setPhone('')
            setIsConfirmed(false)
        }
    }, [])

    return (
        <ConfirmIdentityContext.Provider
            value={{
                phone,
                setPhone,
                token,
                setToken,
                tokenLoading,
                tokenError,
                setTokenError,
                isConfirmed,
                setIsConfirmed,
                handleReCaptchaVerify,
            }}
        >
            {children}
        </ConfirmIdentityContext.Provider>
    )
}
export const useConfirmIdentityContext = () => useContext(ConfirmIdentityContext)