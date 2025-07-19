import get from 'lodash/get'
import { useRouter } from 'next/router'
import {  useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Alert } from '@open-condo/ui'

import { SERVICE_PROBLEMS_ALERT } from '@condo/domains/common/constants/featureflags'


export const ServiceProblemsAlert = () => {
    const router = useRouter()

    const { useFlagValue } = useFeatureFlags()
    const serviceProblemsAlertConfig = useFlagValue(SERVICE_PROBLEMS_ALERT)

    const title = useMemo(() => get(serviceProblemsAlertConfig, 'title'), [serviceProblemsAlertConfig])
    const description = useMemo(() => get(serviceProblemsAlertConfig, 'description'), [serviceProblemsAlertConfig])
    const pages = useMemo(() => get(serviceProblemsAlertConfig, 'pages', []), [serviceProblemsAlertConfig])

    const showOnPage = useMemo(() => pages.length === 0 || pages.some(page => router.pathname.includes(page)),
        [pages, router.pathname])
    const isEmptyAlert = !title && !description

    if (isEmptyAlert || !showOnPage) {
        return null
    }

    return (
        <Alert
            type='warning'
            message={title}
            description={description}
            banner
            showIcon={false}
        />
    )
}