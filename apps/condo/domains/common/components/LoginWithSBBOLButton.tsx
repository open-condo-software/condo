import { useRouter } from 'next/router'
import React from 'react'

import { Sber } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useCheckTLSClientCert } from '@condo/domains/common/hooks/useCheckTLSClientCert'


type LoginWithSBBOLButtonProps = {
    label?: string
    block?: boolean
    redirect?: string
    checkTlsCert: boolean
    tabIndex?: number
    className?: string
}

export const LoginWithSBBOLButton: React.FC<LoginWithSBBOLButtonProps> = ({
    label,
    block,
    redirect,
    checkTlsCert = true,
    tabIndex,
    className,
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

    const buttonClassName = className ? `condo-btn-sbbol ${className}` : 'condo-btn-sbbol'

    return (
        <Button
            key='submit'
            type='secondary'
            className={buttonClassName}
            icon={<Sber color={colors.teal['5']}/>}
            onClick={() => checkTlsCert ? checkSSLClientCert() : redirectToAuth()}
            loading={loading}
            block={block}
            id='loginWithSBBOL'
            tabIndex={tabIndex}
        >
            {label || LoginLabel}
        </Button>
    )
}
