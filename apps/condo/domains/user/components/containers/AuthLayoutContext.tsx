import React, { createContext, useCallback } from 'react'
import { useMutation } from '@core/next/apollo'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useAntdMediaQuery } from '@condo/domains/common/utils/mediaQuery.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, SIGNIN_MUTATION } from '@condo/domains/user/gql'

interface IAuthLayoutContext {
    isMobile: boolean
    signInByEmail: ({ email, password }) => Promise<unknown>,
    signInByPhone: ({ phone, password }) => Promise<unknown>,
}

export const AuthLayoutContext = createContext<IAuthLayoutContext>({
    isMobile: false,
    signInByEmail: ({ email, password }) => null,
    signInByPhone: ({ phone, password }) => null,
})

export const AuthLayoutContextProvider: React.FC = (props) => {
    const intl = useIntl()
    const { refetch } = useAuth()

    const [signinByPhoneMutation] = useMutation(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION)
    const [signinByEmailMutation] = useMutation(SIGNIN_MUTATION)

    const colSize = useAntdMediaQuery()

    const signInByPhone = useCallback(({ phone, password }) => {
        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: signinByPhoneMutation,
            variables: { phone, password },
            onCompleted: () => {
                refetch()
            },
            intl,
        }).catch(error => {
            console.error(error)
        })
    }, [intl])

    const signInByEmail = useCallback(({ email, password }) => {
        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: signinByEmailMutation,
            variables: { email, password },
            onCompleted: () => {
                refetch()
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