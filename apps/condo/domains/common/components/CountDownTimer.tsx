import get from 'lodash/get'
import React, { useEffect, useState } from 'react'

import { extractRootDomain } from '@condo/domains/common/utils/url.utils.js'

import { timer } from '../utils/timer'

const DEFAULT_TIMEOUT = 60 // s

const setCountDownDate = (date, countDownId) => {
    const domain = extractRootDomain(window.location.href)

    document.cookie = `COUNTDOWN_${countDownId}=${date}; path=/; domain=${domain}`
}

const getCountDownDateFromCookies = (countDownId) => {
    if (typeof window === 'undefined') {
        return 0
    }

    const cookie = get(window, ['document', 'cookie'])
    if (!cookie) {
        return 0
    }

    if (cookie.match(countDownId)){
        // not a ReDoS issue: running on end user browser
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        const coundownRegexp = new RegExp(`(?:(?:^|.*;\\s*)COUNTDOWN_${countDownId}\\s*=\\s*([^;]*).*$)|^.*$`)

        const countDownFromCookie = document
            .cookie
            .replace(coundownRegexp, '$1')

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

type CountDownChildrenType = (
    // TODO(Dimitreee): remove any
    { countdown, runAction, loading }: { countdown: number, runAction: () => Promise<any>, loading: boolean }
) => JSX.Element

interface ICountDownTimer {
    // TODO(Dimitreee): remove any
    action: (...args: any[]) => Promise<any>
    id: string
    timeout?: number
    children: CountDownChildrenType
    autostart?: boolean
}

export const CountDownTimer: React.FC<ICountDownTimer> = (props) => {
    const { action, id, timeout = DEFAULT_TIMEOUT, autostart = false } = props

    const [loading, setLoading] = useState(false)
    const [countdown, setCountDown] = useState(0)

    const startTimer = React.useCallback((duration) => {
        timer({
            duration,
            onStart: (countDownDate) => {
                setCountDownDate(countDownDate, id)
            },
            onUpdate: (currentDuration) => {
                setCountDown(currentDuration)
            },
            onFinish: () => {
                setCountDown(0)
                setCountDownDate(0, id)
            },
        })
    }, [])

    useEffect(() => {
        const countDownFromCookies = getCountDownDateFromCookies(id)
        if (autostart) {
            setCountDown(timeout)
            startTimer(timeout)
        } else if (countDownFromCookies) {
            setCountDown(countDownFromCookies)
            startTimer(countDownFromCookies)
        }
    }, [])

    const runAction = () => {
        if (countdown > 0) {
            return Promise.resolve()
        }

        startTimer(timeout)
        setLoading(true)

        return action()
            .then((res) => {
                setLoading(false)
                return res
            })
            .catch((e) => {
                setLoading(false)
                throw e
            })
    }

    return props.children({ countdown, runAction, loading })
}
