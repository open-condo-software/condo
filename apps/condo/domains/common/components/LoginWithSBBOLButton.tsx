// TODO: Restyle and refactor this button someday later
import { useRouter } from 'next/router'
import React from 'react'

import { Sber } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useCheckTLSClientCert } from '../hooks/useCheckTLSClientCert'

export const LoginWithSBBOLButton: React.FC<{ label?: string, block?: boolean, redirect?: string, checkTlsCert: boolean }> = ({
    label,
    block,
    redirect,
    checkTlsCert = true,
}) => {
    const intl = useIntl()
    const LoginLabel = intl.formatMessage({ id: 'LoginBySBBOL' })
    const router = useRouter()

    const redirectToAuth = async () => {
        const queryParams = redirect ? `?redirectUrl=${encodeURIComponent(redirect)}` : ''
        const authUrl = `/api/sbbol/auth${queryParams}`
        await router.push(authUrl)
    }

    const redirectToTlsPage = async () => {
        await router.push('/tls')
    }

    const { loading, checkSSLClientCert } = useCheckTLSClientCert({
        onSuccess: redirectToAuth,
        onFail: redirectToTlsPage,
    })

    return (
        <Button
            key='submit'
            type='secondary'
            className='condo-btn-sbbol'
            icon={<Sber color={colors.teal['5']}/>}
            onClick={() => checkTlsCert ? checkSSLClientCert() : redirectToAuth()}
            loading={loading}
            block={block}
        >
            {label || LoginLabel}
        </Button>
    )
}