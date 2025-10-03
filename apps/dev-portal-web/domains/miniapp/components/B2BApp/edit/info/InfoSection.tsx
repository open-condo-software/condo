import React from 'react'
import { useIntl } from 'react-intl'

import { Section, SubSection } from '@/domains/miniapp/components/AppSettings'
import { CommonInfoSubsection } from '@/domains/miniapp/components/B2BApp/edit/info/CommonInfoSubsection'

export const InfoSection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const CommonInfoSubtitle = intl.formatMessage({ id: 'apps.b2b.sections.info.commonInfo.subtitle' })

    return (
        <Section>
            <SubSection title={CommonInfoSubtitle}>
                <CommonInfoSubsection id={id}/>
            </SubSection>
        </Section>
    )
}