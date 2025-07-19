// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Typography } from 'antd'
import Router, { useRouter } from 'next/router'
import qs from 'qs'
import React, { useEffect } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'


import { isFunction } from '../../utils/ecmascript.utils'
import { Loader } from '../Loader'


function RedirectToLogin () {
    const intl = useIntl()
    const RedirectingMessage = intl.formatMessage({ id: 'Redirecting' })

    const { asPath } = useRouter()

    useEffect(() => {
        const clearHandle = setTimeout(() => {
            Router.push('/auth/signin?' + qs.stringify({ next: asPath }))
        }, 200)
        return () => {
            clearTimeout(clearHandle)
        }
    })
    return <Typography.Text style={{ textAlign: 'center' }}>{RedirectingMessage}</Typography.Text>
}

export const AuthRequired: React.FC<React.PropsWithChildren> = ({ children }) => {
    const intl = useIntl()
    const SignInRequiredMessage = intl.formatMessage({ id: 'SignInRequired' })

    const auth = useAuth()
    const { isAuthenticated, isLoading } = auth

    if (isLoading) {
        return <Loader fill size='large'/>
    }

    if (!isAuthenticated) {
        return <>
            <Typography.Title style={{ textAlign: 'center' }}>{SignInRequiredMessage}</Typography.Title>
            <RedirectToLogin/>
        </>
    }

    if (isFunction(children)) {
        return children(auth)
    }

    return children
}
