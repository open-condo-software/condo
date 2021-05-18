import { Typography } from 'antd'
import get from 'lodash/get'
import React, { useEffect, useState } from 'react'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useAuth } from '@core/next/auth'
import { FormattedMessage } from 'react-intl'
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
        const countDownFromCookie = document
            .cookie
            .replace(/(?:(?:^|.*;\s*)COUNTDOWN_DATE\s*=\s*([^;]*).*$)|^.*$/, '$1')

        if (!countDownFromCookie) {
            return 0
        }

        const now = new Date()
        const countDownDate = new Date(countDownFromCookie)

        if (countDownDate < now) {
            return 0
        } else {
            return new Date(Number(countDownDate) - Number(now)).getSeconds()
        }
    }
}

export const UserPasswordResetButton = () => {
    const intl = useIntl()
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePassword' })
    const { user } = useAuth()
    const [passwordRecoveryLoading, setPasswordRecoveryLoading] = React.useState(false)
    const [startPasswordRecovery] = useMutation(START_PASSWORD_RECOVERY_MUTATION)
    const [countdown, setCountDown] = useState(0)

    const startTimer = React.useCallback((duration) => {
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
    }, [])

    useEffect(() => {
        const countDownFromCookies = getCountDownDateFromCookies()
        setCountDown(countDownFromCookies)
        startTimer(countDownFromCookies)
    }, [])

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
            onFinally: () => {
                setPasswordRecoveryLoading(false)
            },
            intl,
        }).catch(() => {
            setPasswordRecoveryLoading(false)
        })
    }

    const isCountDownActive = countdown > 0

    return (
        <Button
            onClick={updatePassword}
            type={'inlineLink'}
            loading={passwordRecoveryLoading}
            disabled={isCountDownActive}
        >
            {ChangePasswordLabel}
            {isCountDownActive && (
                <Typography.Text type={'secondary'}>
                    &nbsp;
                    <FormattedMessage
                        id='profile.PasswordResetTimeout'
                        values={{
                            countdown,
                        }}
                    />
                </Typography.Text>
            )}
        </Button>
    )
}
