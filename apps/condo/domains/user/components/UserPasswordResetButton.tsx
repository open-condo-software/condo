import { Typography } from 'antd'
import get from 'lodash/get'
import React, { useEffect, useState } from 'react'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useAuth } from '@core/next/auth'
import { timer } from '../../common/utils/timer'
import { START_PASSWORD_RECOVERY_MUTATION } from '../gql'
import { extractRootDomain } from '@condo/domains/common/utils/url.utils.js'

const PASSWORD_RESET_TIMEOUT = 60 // s

const setCountDownDate = (date) => {
    const domain = extractRootDomain(window.location.href)

    document.cookie = `COUNTDOWN_DATE=${date}; path=/; domain=${domain}`
}

const getCountDownDateFromCookies = () => {
    if (typeof window === 'undefined') {
        return 0
    }

    const cookie = get(window, ['document', 'cookie'])
    if (!cookie) {
        return 0
    }

    if (cookie.match('COUNTDOWN_DATE')){
        const countDownFromCookie = document.cookie.replace(/(?:(?:^|.*;\s*)COUNTDOWN_DATE\s*\=\s*([^;]*).*$)|^.*$/, '$1')
        console.log(new Date(countDownFromCookie))

        if (!countDownFromCookie) {
            return 0
        }

        if (new Date(countDownFromCookie) < new Date()) {
            return 0
        } else {
            return new Date( Number(new Date(countDownFromCookie)) - Number(new Date())).getSeconds()
        }
    }
}

export const UserPasswordResetButton = () => {
    const intl = useIntl()
    const { user } = useAuth()

    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePassword' })
    const [passwordRecoveryLoading, setPasswordRecoveryLoading] = React.useState(false)
    const [startPasswordRecovery] = useMutation(START_PASSWORD_RECOVERY_MUTATION)
    const [countdown, setCountDown] = useState(0)

    useEffect(() => {
        const countDownFromCookies = getCountDownDateFromCookies()
        setCountDown(countDownFromCookies)
        startTimer(countDownFromCookies)
    }, [])

    const startTimer = (duration) => {
        timer({
            duration,
            onStart: (countDownDate) => {
                setCountDownDate(countDownDate)
            },
            onUpdate: (currentDuration) => {
                setCountDown(currentDuration)
            },
            onFinish: () => {
                setCountDown(0)
                setCountDownDate(0)
            },
        })
    }

    const updatePassword = () => {
        setPasswordRecoveryLoading(true)
        startTimer(PASSWORD_RESET_TIMEOUT)

        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: startPasswordRecovery,
            variables: {
                email: get(user, 'email'),
            },
            onCompleted: () => {
                setPasswordRecoveryLoading(false)
            },
            onFinally: () => setPasswordRecoveryLoading(false),
            intl,
        }).catch(() => {
            setPasswordRecoveryLoading(false)
        })
    }

    return (
        <Button
            onClick={updatePassword}
            type={'inlineLink'}
            loading={passwordRecoveryLoading}
            disabled={countdown > 0}
        >
            {ChangePasswordLabel}
            {countdown > 0 && (
                <Typography.Text type={'secondary'}>
                    &nbsp;{`(сбросить ещё раз можно через 00:${countdown} секунд)`}
                </Typography.Text>
            )}
        </Button>
    )
}
