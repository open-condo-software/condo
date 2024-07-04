import cookie from 'js-cookie'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Alert } from '@open-condo/ui'

import { SERVICE_PROBLEMS_ALERT } from '@condo/domains/common/constants/featureflags'


const SERVICE_PROBLEMS_ALERT_COOKIE_KEY = 'serviceProblemsAlert'
const SERVICE_PROBLEMS_ALERT_COOKIE_EXPIRES_IN_SECONDS = 3 * 60 * 60 * 1000 // 3 hours

export const ServiceProblemsAlert = () => {
    const router = useRouter()

    const { useFlagValue } = useFeatureFlags()
    const serviceProblemsAlertConfig = useFlagValue(SERVICE_PROBLEMS_ALERT)

    const title = useMemo(() => get(serviceProblemsAlertConfig, 'title'), [serviceProblemsAlertConfig])
    const description = useMemo(() => get(serviceProblemsAlertConfig, 'description'), [serviceProblemsAlertConfig])
    const pages = useMemo(() => get(serviceProblemsAlertConfig, 'pages', []), [serviceProblemsAlertConfig])

    // do not show alert for some time if user closed it
    const expires = useMemo(() => new Date(new Date().getTime() + SERVICE_PROBLEMS_ALERT_COOKIE_EXPIRES_IN_SECONDS), [])
    const handleClose = useCallback(() =>  cookie.set(SERVICE_PROBLEMS_ALERT_COOKIE_KEY, true, { expires }), [expires])
    const alreadyClosed = useMemo(() => cookie.get(SERVICE_PROBLEMS_ALERT_COOKIE_KEY), [])

    const showOnPage = useMemo(() => pages.length === 0 || pages.some(page => router.pathname.includes(page)),
        [pages, router.pathname])
    const isEmptyAlert = !title && !description

    if (isEmptyAlert || alreadyClosed || !showOnPage) {
        return null
    }

    return (
        <Alert
            type='warning'
            message={title}
            description={description}
            closable
            onClose={handleClose}
        />
    )
}