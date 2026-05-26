import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Close } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/hooks'

import { SERVICE_PROBLEMS_ALERT } from '@condo/domains/common/constants/featureflags'

const SERVICE_PROBLEM_ALERT_CLOSE_TIME_KEY = 'service-problems-alert'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const ServiceProblemsAlert = () => {
    const intl = useIntl()
    const CloseButtonLabel = intl.formatMessage({ id: 'Close' })

    const router = useRouter()

    const { useFlagValue } = useFeatureFlags()
    const serviceProblemsAlertConfig = useFlagValue(SERVICE_PROBLEMS_ALERT)
    const breakpoints = useBreakpoints()

    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window === 'undefined') return false
        const hiddenUntil = localStorage.getItem(SERVICE_PROBLEM_ALERT_CLOSE_TIME_KEY)
        if (!hiddenUntil) return true
        const hiddenUntilTime = parseInt(hiddenUntil, 10)
        return Date.now() > hiddenUntilTime
    })

    const handleClose = useCallback(() => {
        const hiddenUntil = Date.now() + ONE_DAY_MS
        localStorage.setItem(SERVICE_PROBLEM_ALERT_CLOSE_TIME_KEY, hiddenUntil.toString())
        setIsOpen(false)
    }, [])

    const title = useMemo(() => get(serviceProblemsAlertConfig, 'title'), [serviceProblemsAlertConfig])
    const description = useMemo(() => get(serviceProblemsAlertConfig, 'description'), [serviceProblemsAlertConfig])
    const pages = useMemo(() => get(serviceProblemsAlertConfig, 'pages', []), [serviceProblemsAlertConfig])

    const showOnPage = useMemo(() => pages.length === 0 || pages.some(page => router.pathname.includes(page)),
        [pages, router.pathname])
    const isEmptyAlert = !title && !description

    const actions = useMemo(()=> {
        if (breakpoints.TABLET_LARGE) {
            return [
                <Button
                    icon={
                        <Close size='medium'/>
                    }
                    onClick={handleClose}
                    type='primary'
                    compact
                    minimal
                    key={1}
                />,
            ]
        }

        return [
            <Button
                type='primary'
                key={1}
                onClick={handleClose}
            >
                {CloseButtonLabel}
            </Button>,
        ]
    }, [CloseButtonLabel, breakpoints.TABLET_LARGE, handleClose])

    if (isEmptyAlert || !showOnPage || !isOpen) {
        return null
    }

    return (
        <Alert
            type='warning'
            message={title}
            description={description}
            banner
            action={actions}
            showIcon={false}
        />
    )
}