import React from 'react'
import { useIntl } from 'react-intl'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'

import { CommonInfoSubsection } from './CommonInfoSubsection'
import { IconsSubsection } from './IconsSubsection'

export const InfoSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const CommonInfoSubtitle = intl.formatMessage({ id: 'apps.b2c.sections.info.commonInfo.subtitle' })
    const AppIconsSubtitle = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.subtitle' })

    return (
        <Section>
            <SubSection title={CommonInfoSubtitle}>
                <CommonInfoSubsection id={id}/>
            </SubSection>
            <SubSection title={AppIconsSubtitle}>
                <IconsSubsection id={id}/>
            </SubSection>
        </Section>
    )
}