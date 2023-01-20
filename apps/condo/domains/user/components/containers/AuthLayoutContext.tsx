import React, { createContext, useCallback } from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, SIGNIN_MUTATION } from '@condo/domains/user/gql'

interface IAuthLayoutContext {
    isMobile: boolean
    signInByEmail: ({ email, password }, onCompleted?: () => void) => Promise<unknown>,
    signInByPhone: ({ phone, password }, onCompleted?: () => void) => Promise<unknown>,
}

export const AuthLayoutContext = createContext<IAuthLayoutContext>({
    isMobile: false,
    signInByEmail: () => null,
    signInByPhone: () => null,
})

export const AuthLayoutContextProvider: React.FC = (props) => {
    const intl = useIntl()
    const { refetch } = useAuth()

    const [signinByPhoneMutation] = useMutation(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION)
    const [signinByEmailMutation] = useMutation(SIGNIN_MUTATION)
    const { isMobile } = useLayoutContext()

    const signInByPhone = useCallback((variables, onCompleted) => {
        return runMutation({
            mutation: signinByPhoneMutation,
            variables,
            onCompleted: () => {
                refetch().then(() => {
                    onCompleted()
                })
            },
            // Skip notification
            OnCompletedMsg: null,
            onError: (error) => {
                console.error(error)
            },
            intl,
        })
    }, [intl])

    const signInByEmail = useCallback((variables, onCompleted) => {
        return runMutation({
            mutation: signinByEmailMutation,
            variables,
            onCompleted: () => {
                refetch().then(() => {
                    onCompleted()
                })
            },
            // Skip notification
            OnCompletedMsg: null,
            onError: (error) => {
                console.error(error)
            },
            intl,
        })
    }, [intl])

    return (
        <AuthLayoutContext.Provider value={{
            isMobile,
            signInByEmail,
            signInByPhone,
        }}>
            {props.children}
        </AuthLayoutContext.Provider>
    )
}