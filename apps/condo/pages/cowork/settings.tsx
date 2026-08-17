import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CoworkLayout } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { UI_AI_COWORK_SETTINGS } from '@condo/domains/common/constants/featureflags'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const CoworkSettingsPage: PageComponentType = () => {
    const intl = useIntl()
    const router = useRouter()
    const { useFlag } = useFeatureFlags()
    const settingsEnabled = useFlag(UI_AI_COWORK_SETTINGS)

    const titleLabel = intl.formatMessage({ id: 'ai.cowork.settings' })
    const comingSoonLabel = intl.formatMessage({ id: 'ai.cowork.comingSoon' })

    useEffect(() => {
        if (!settingsEnabled) void router.replace('/cowork')
    }, [settingsEnabled, router])

    if (!settingsEnabled) return null

    return (
        <div className={coworkStyles.coworkBody}>
            <div className={coworkStyles.mainArea}>
                <div className={coworkStyles.miniappsContent}>
                    <div className={coworkStyles.miniappsHeader}>
                        <Typography.Title level={2}>{titleLabel}</Typography.Title>
                    </div>
                    <div className={coworkStyles.miniappsLoading}>{comingSoonLabel}</div>
                </div>
            </div>
        </div>
    )
}

CoworkSettingsPage.requiredAccess = OrganizationRequired
CoworkSettingsPage.container = CoworkLayout

export default CoworkSettingsPage
