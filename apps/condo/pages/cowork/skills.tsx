import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { Button, Typography } from '@open-condo/ui'

import { CoworkLayout } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { UI_AI_COWORK_SKILLS } from '@condo/domains/common/constants/featureflags'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'


const SKILL_IDS = ['meterReadings', 'ticketTriage'] as const

const CoworkSkillsPage: PageComponentType = () => {
    const intl = useIntl()
    const router = useRouter()
    const { useFlag } = useFeatureFlags()
    const skillsEnabled = useFlag(UI_AI_COWORK_SKILLS)

    const titleLabel = intl.formatMessage({ id: 'ai.cowork.skills' })
    const subtitleLabel = intl.formatMessage({ id: 'ai.cowork.skills.subtitle' })
    const runLabel = intl.formatMessage({ id: 'ai.cowork.skills.run' })

    const skills = useMemo(() => SKILL_IDS.map((id) => ({
        id,
        name: intl.formatMessage({ id: `ai.cowork.skills.${id}.name` }),
        description: intl.formatMessage({ id: `ai.cowork.skills.${id}.description` }),
        prompt: intl.formatMessage({ id: `ai.cowork.skills.${id}.prompt` }),
    })), [intl])

    const handleRun = (prompt: string) => {
        void router.push({
            pathname: '/cowork/chat',
            query: { prompt },
        })
    }

    useEffect(() => {
        if (!skillsEnabled) void router.replace('/cowork')
    }, [skillsEnabled, router])

    if (!skillsEnabled) return null

    return (
        <div className={coworkStyles.coworkBody}>
            <div className={coworkStyles.mainArea}>
                <div className={coworkStyles.miniappsContent}>
                    <div className={coworkStyles.miniappsHeader}>
                        <div>
                            <Typography.Title level={2}>{titleLabel}</Typography.Title>
                            <Typography.Text type='secondary'>{subtitleLabel}</Typography.Text>
                        </div>
                    </div>
                    <div className={coworkStyles.miniappsGrid}>
                        {skills.map((skill) => (
                            <div key={skill.id} className={coworkStyles.miniappCard}>
                                <div className={coworkStyles.miniappCardHeader}>
                                    <div className={coworkStyles.miniappCardName}>{skill.name}</div>
                                </div>
                                <Typography.Text type='secondary' size='medium'>
                                    {skill.description}
                                </Typography.Text>
                                <div className={coworkStyles.miniappCardFooter}>
                                    <Button
                                        type='secondary'
                                        size='medium'
                                        onClick={() => handleRun(skill.prompt)}
                                    >
                                        {runLabel}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

CoworkSkillsPage.requiredAccess = OrganizationRequired
CoworkSkillsPage.container = CoworkLayout

export default CoworkSkillsPage
