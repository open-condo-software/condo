import { useGetPhoneByConfirmPhoneActionTokenLazyQuery } from '@app/condo/gql'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { createContext, Dispatch, SetStateAction, useEffect, useState, useContext } from 'react'

import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'


interface IRegisterContext {
    token: string
    setToken: Dispatch<SetStateAction<string>>
    phone: string
    setPhone: Dispatch<SetStateAction<string>>
    tokenError: Error
    setTokenError: Dispatch<SetStateAction<Error>>
    isConfirmed: boolean
}

export const RegisterContext = createContext<IRegisterContext>({
    token: '',
    setToken: () => null,
    phone: '',
    setPhone: () => null,
    tokenError: null,
    setTokenError: (error) => null,
    isConfirmed: false,
})

export const useRegisterContext = (): IRegisterContext => useContext(RegisterContext)

export const RegisterContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { executeCaptcha } = useHCaptcha()

    const { query: { token: tokenFromQuery } } = useRouter()
    const queryToken = typeof tokenFromQuery === 'string' ? tokenFromQuery : ''

    const [token, setToken] = useState<string>(queryToken)
    const [phone, setPhone] = useState<string>('')
    const [tokenError, setTokenError] = useState<Error | null>(null)
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false)

    const [loadTokenInfo] = useGetPhoneByConfirmPhoneActionTokenLazyQuery({
        onError: (error) => {
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
            executeCaptcha().then(captcha => {
                if (captcha) {
                    loadTokenInfo({
                        variables: {
                            data: {
                                token: queryToken,
                                captcha,
                            },
                        },
                    })
                }
            })
        } else {
            setPhone(phone)
            setIsConfirmed(false)
        }
    }, [queryToken, executeCaptcha, loadTokenInfo, phone])

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
            }}
        >
            {children}
        </RegisterContext.Provider>
    )
}