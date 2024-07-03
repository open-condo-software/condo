import cookie from 'js-cookie'
import get from 'lodash/get'
import { useCallback, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Alert } from '@open-condo/ui'

import { NOT_WORKING_ALERT } from '@condo/domains/common/constants/featureflags'


const NOT_WORKING_ALERT_COOKIE_KEY = 'notWorkingAlert'
const NOT_WORKING_ALERT_COOKIE_EXPIRES_IN_SECONDS = 3 * 60 * 60 * 1000 // 3 hours

export const NotWorkingAlert = () => {
    const { useFlagValue } = useFeatureFlags()
    const notWorkingAlert = useFlagValue(NOT_WORKING_ALERT)

    const title = get(notWorkingAlert, 'title')
    const description = get(notWorkingAlert, 'description')

    // do not show alert for some time if user closed it
    const expires = useMemo(() => new Date(new Date().getTime() + NOT_WORKING_ALERT_COOKIE_EXPIRES_IN_SECONDS), [])
    const handleClose = useCallback(() =>  cookie.set(NOT_WORKING_ALERT_COOKIE_KEY, true, { expires }), [expires])
    const alreadyClosed = useMemo(() => cookie.get(NOT_WORKING_ALERT_COOKIE_KEY), [])

    if (!notWorkingAlert || alreadyClosed) {
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