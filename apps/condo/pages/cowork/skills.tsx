import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CoworkLayout, CoworkSidebar } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const CoworkSkillsPage: PageComponentType = () => {
    const intl = useIntl()

    const titleLabel = intl.formatMessage({ id: 'ai.cowork.skills' })
    const comingSoonLabel = intl.formatMessage({ id: 'ai.cowork.comingSoon' })

    return (
        <div className={coworkStyles.coworkBody}>
            <CoworkSidebar
                highlightNavItem='skills'
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

CoworkSkillsPage.requiredAccess = OrganizationRequired
CoworkSkillsPage.container = CoworkLayout

export default CoworkSkillsPage
