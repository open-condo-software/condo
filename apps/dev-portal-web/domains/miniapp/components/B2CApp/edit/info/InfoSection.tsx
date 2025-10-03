import React from 'react'
import { useIntl } from 'react-intl'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { EnvironmentInfoSubsection } from '@/domains/miniapp/components/B2CApp/edit/info/EnvironmentInfoSubsection'

import { CommonInfoSubsection } from './CommonInfoSubsection'
import { IconsSubsection } from './IconsSubsection'

export const InfoSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const CommonInfoSubtitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.commonInfo.subtitle' })
    const EnvironmentInfoSubtitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.environmentInfo.subtitle' })
    const AppIconsSubtitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.icons.subtitle' })

    return (
        <Section>
            <SubSection title={CommonInfoSubtitle}>
                <CommonInfoSubsection id={id}/>
            </SubSection>
            <SubSection title={EnvironmentInfoSubtitle}>
                <EnvironmentInfoSubsection id={id}/>
            </SubSection>
            <SubSection title={AppIconsSubtitle}>
                <IconsSubsection id={id}/>
            </SubSection>
        </Section>
    )
}