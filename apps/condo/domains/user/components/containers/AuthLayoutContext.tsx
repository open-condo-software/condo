import React, { createContext, useCallback } from 'react'
import { useApolloClient, useMutation } from '@core/next/apollo'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useAntdMediaQuery } from '@condo/domains/common/utils/mediaQuery.utils'
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

    const colSize = useAntdMediaQuery()

    const signInByPhone = useCallback((variables, onCompleted) => {
        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: signinByPhoneMutation,
            variables,
            onCompleted: () => {
                refetch()
                onCompleted()
            },
            intl,
        }).catch(error => {
            console.error(error)
        })
    }, [intl])

    const signInByEmail = useCallback((variables, onCompleted) => {
        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: signinByEmailMutation,
            variables,
            onCompleted: () => {
                refetch()
                onCompleted()
            },
            intl,
        }).catch(error => {
            console.error(error)
        })
    }, [intl])

    return (
        <AuthLayoutContext.Provider value={{
            isMobile: colSize === 'xs',
            signInByEmail,
            signInByPhone,
        }}>
            {props.children}
        </AuthLayoutContext.Provider>
    )
}