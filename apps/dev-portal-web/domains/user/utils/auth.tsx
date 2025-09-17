import { useApolloClient } from '@apollo/client'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { Modal, Typography, Space } from '@open-condo/ui'

import { AuthForm } from '@/domains/common/components/auth/AuthForm'

import styles from './AuthModal.module.css'

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client'

import {
    AuthenticatedUserDocument,
    useAuthenticatedUserQuery,
    AuthenticatedUserQuery,
    useSignOutMutation,
} from '@/gql'


type AuthenticatedUserType = AuthenticatedUserQuery['authenticatedUser']

type AuthContextType = {
    isAuthenticated: boolean
    isLoading: boolean
    user: AuthenticatedUserType | null
    signOut: () => void
    refetchAuth: () => Promise<void>
    startSignIn: () => void
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    signOut: () => ({}),
    refetchAuth: () => Promise.resolve(),
    startSignIn: () => ({}),
})

export const AuthProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const intl = useIntl()
    const WelcomeTitle = intl.formatMessage({ id: 'global.authForm.welcome.title' })
    const WelcomeDescriptionText = intl.formatMessage({ id: 'global.authForm.welcome.description' })
    const apolloClient = useApolloClient()
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const { data: auth, loading: userLoading, refetch } = useAuthenticatedUserQuery()

    const [user, setUser] = useState<AuthenticatedUserType>(get(auth, 'authenticatedUser', null))
    const router = useRouter()

    const refetchAuth = useCallback(async () => {
        await apolloClient.clearStore()
        await refetch()
    }, [apolloClient, refetch])

    const [signOutMutation, { loading: signOutLoading }] = useSignOutMutation({
        onCompleted: async (data) => {
            const success = get(data, ['unauthenticateUser', 'success'])
            if (success) {
                setUser(null)
            }
            await refetchAuth().then(() => {
                if (!router.asPath.startsWith('/docs')) {
                    router.push('/', '/', { locale: router.locale })
                }
            })
        },
        onError: (error) => {
            console.error(error)
        },
    })
    
    useEffect(() => {
        if (!userLoading) {
            setUser(get(auth, 'authenticatedUser', null))
        }
    }, [userLoading, auth])

    const signOut = useCallback(() => {
        signOutMutation()
    }, [signOutMutation])

    const handleModalClose = useCallback(() => {
        setAuthModalOpen(false)
    }, [])

    const handleAuthComplete = useCallback(() => {
        refetchAuth().then(handleModalClose)
    }, [refetchAuth, handleModalClose])

    const startSignIn = useCallback(() => {
        setAuthModalOpen(true)
    }, [])

    return (
        <AuthContext.Provider
            value={{
                isLoading: userLoading || signOutLoading,
                isAuthenticated: !!user,
                user,
                signOut,
                refetchAuth,
                startSignIn,
            }}
        >
            {children}
            {authModalOpen && (
                <Modal
                    title={WelcomeTitle}
                    open={authModalOpen}
                    onCancel={handleModalClose}
                    className={styles.condoAuthModal}
                >
                    <div className={styles.contentContainer}>
                        <Typography.Text type='secondary' size='medium'>
                            {WelcomeDescriptionText}
                        </Typography.Text>
                        <AuthForm onComplete={handleAuthComplete}/>
                    </div>
                </Modal>
            )}
        </AuthContext.Provider>
    )
}

export const useAuth = (): AuthContextType => useContext(AuthContext)

/**
 * Prefetches user auth in getServerSideProps
 * @param {ApolloClient<NormalizedCacheObject>} client - apollo client
 */
export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>): Promise<AuthenticatedUserType> {
    const response = await client.query<AuthenticatedUserQuery>({
        query: AuthenticatedUserDocument,
    })
    return response.data.authenticatedUser
}