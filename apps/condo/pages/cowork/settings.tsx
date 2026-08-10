import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CoworkLayout, CoworkSidebar } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const CoworkSettingsPage: PageComponentType = () => {
    const intl = useIntl()

    const titleLabel = intl.formatMessage({ id: 'ai.cowork.settings' })
    const comingSoonLabel = intl.formatMessage({ id: 'ai.cowork.comingSoon' })

    return (
        <div className={coworkStyles.coworkBody}>
            <CoworkSidebar
                highlightNavItem='settings'
            />
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
