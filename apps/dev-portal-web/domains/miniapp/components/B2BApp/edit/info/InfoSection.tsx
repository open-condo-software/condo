import React from 'react'
import { useIntl } from 'react-intl'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { CommonInfoSubsection } from '@/domains/miniapp/components/B2BApp/edit/info/CommonInfoSubsection'
import { EntrypointsSubsection } from '@/domains/miniapp/components/Info/EntrypointsSubsection'

import { EnvironmentInfoSubsection } from './EnvironmentInfoSubsection'

export const InfoSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const CommonInfoSubtitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.commonInfo.subtitle' })
    const EntrypointsSubtitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.info.entrypoints.subtitle' })
    const EnvironmentInfoSubtitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.environmentInfo.subtitle' })

    return (
        <Section>
            <SubSection title={CommonInfoSubtitle}>
                <CommonInfoSubsection id={id}/>
            </SubSection>
            <SubSection title={EntrypointsSubtitle}>
                <EntrypointsSubsection id={id} type='b2b'/>
            </SubSection>
            <SubSection title={EnvironmentInfoSubtitle}>
                <EnvironmentInfoSubsection id={id}/>
            </SubSection>
        </Section>
    )
}