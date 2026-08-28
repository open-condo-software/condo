import React from 'react'
import { useIntl } from 'react-intl'

import { EmptySubSectionView } from '@/domains/miniapp/components/EmptySubSectionView'

import type { AppEnvironment } from '@/gql'

type AutoPublishViewProps = {
    environment: AppEnvironment
}


export const AutoPublishView: React.FC<AutoPublishViewProps> = ({ environment }) => {
    const intl = useIntl()
    const EnvironmentLabel = useIntl().formatMessage({ id: `global.miniapp.environments.${environment}.label` })
    const AutoPublishEnabledTitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.publishing.autoPublishView.title' })
    const AutoPublishEnabledDescription = intl.formatMessage({ id: 'pages.apps.any.id.sections.publishing.autoPublishView.description' }, {
        environment: EnvironmentLabel.toLowerCase(),
    })

    return (
        <EmptySubSectionView
            image='/mascot/success.webp'
            title={AutoPublishEnabledTitle}
            description={AutoPublishEnabledDescription}
        />
    )
}