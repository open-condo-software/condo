import React from 'react'
import { useIntl } from 'react-intl'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { EnvironmentInfoSubsection } from '@/domains/miniapp/components/B2CApp/edit/info/EnvironmentInfoSubsection'


import { CommonInfoSubsection } from './CommonInfoSubsection'
import { EntrypointsSubsection } from './EntrypointsSubsection'
import { IconsSubsection } from './IconsSubsection'

import { B2CAppTypeType, useGetB2CAppQuery } from '@/gql'

export const InfoSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const CommonInfoSubtitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.commonInfo.subtitle' })
    const EntryPointsSubtitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.entrypoints.subtitle' })
    const EnvironmentInfoSubtitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.environmentInfo.subtitle' })
    const AppIconsSubtitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.info.icons.subtitle' })

    const { data } = useGetB2CAppQuery({
        variables: { id },
    })

    return (
        <Section>
            <SubSection title={CommonInfoSubtitle}>
                <CommonInfoSubsection id={id}/>
            </SubSection>
            {Boolean(data?.app?.type === B2CAppTypeType.Web) && (
                <SubSection title={EntryPointsSubtitle}>
                    <EntrypointsSubsection id={id}/>
                </SubSection>
            )}
            <SubSection title={EnvironmentInfoSubtitle}>
                <EnvironmentInfoSubsection id={id}/>
            </SubSection>
            <SubSection title={AppIconsSubtitle}>
                <IconsSubsection id={id}/>
            </SubSection>
        </Section>
    )
}