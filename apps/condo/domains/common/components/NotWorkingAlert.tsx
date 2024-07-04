import cookie from 'js-cookie'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Alert } from '@open-condo/ui'

import { NOT_WORKING_ALERT } from '@condo/domains/common/constants/featureflags'


const NOT_WORKING_ALERT_COOKIE_KEY = 'notWorkingAlert'
const NOT_WORKING_ALERT_COOKIE_EXPIRES_IN_SECONDS = 3 * 60 * 60 * 1000 // 3 hours

export const NotWorkingAlert = () => {
    const router = useRouter()

    const { useFlagValue } = useFeatureFlags()
    const notWorkingAlert = useFlagValue(NOT_WORKING_ALERT)

    const title = useMemo(() => get(notWorkingAlert, 'title'), [notWorkingAlert])
    const description = useMemo(() => get(notWorkingAlert, 'description'), [notWorkingAlert])
    const pages = useMemo(() => get(notWorkingAlert, 'pages', []), [notWorkingAlert])

    // do not show alert for some time if user closed it
    const expires = useMemo(() => new Date(new Date().getTime() + NOT_WORKING_ALERT_COOKIE_EXPIRES_IN_SECONDS), [])
    const handleClose = useCallback(() =>  cookie.set(NOT_WORKING_ALERT_COOKIE_KEY, true, { expires }), [expires])
    const alreadyClosed = useMemo(() => cookie.get(NOT_WORKING_ALERT_COOKIE_KEY), [])

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