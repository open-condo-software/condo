import { Space } from 'antd'
import React from 'react'


import { useIntl } from '@open-condo/next/intl'
import { Card, Typography } from '@open-condo/ui'

import type { SpaceProps } from 'antd'

const SECTION_VERT_SPACING = 20
const SECTION_HOR_SPACING = 100
const LABEL_SPACING = 4
const CARD_SPACE_VERT_LAYOUT_PROPS: SpaceProps = {
    direction: 'vertical',
    size: SECTION_VERT_SPACING,
    wrap: false,
}
const CARD_SPACE_HOR_LAYOUT_PROPS: SpaceProps = {
    direction: 'horizontal',
    size: [SECTION_HOR_SPACING, SECTION_VERT_SPACING],
    wrap: true,
    align: 'start',
}

type SectionProps = {
    label: string
    value: string
}

type DeveloperCardProps = {
    developer: string
    publishedAt: string
    developerUrl?: string
    display: 'row' | 'col'
}

const Section: React.FC<SectionProps> = ({ label, value }) => {
    return (
        <Space direction='vertical' size={LABEL_SPACING}>
            <Typography.Text size='medium' type='secondary'>{label}</Typography.Text>
            <Typography.Text>{value}</Typography.Text>
        </Space>
    )
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ developer, publishedAt, developerUrl, display }) => {
    const intl = useIntl()
    const DeveloperLabel = intl.formatMessage({ id: 'miniapps.developerCard.developer' })
    const PublishedLabel = intl.formatMessage({ id: 'miniapps.developerCard.publishedAt' })
    const PartnerLabel = intl.formatMessage({ id: 'miniapps.developerCard.partnerSite' })
    const PublishDate = intl.formatDate(publishedAt)

    const spaceProps: SpaceProps = display === 'col' ? CARD_SPACE_VERT_LAYOUT_PROPS : CARD_SPACE_HOR_LAYOUT_PROPS

    return (
        <Card>
            <Space {...spaceProps}>
                <Section label={DeveloperLabel} value={developer}/>
                <Section label={PublishedLabel} value={PublishDate}/>
                {Boolean(developerUrl) && (
                    <Typography.Link href={developerUrl} target='_blank'>{PartnerLabel}</Typography.Link>
                )}
            </Space>
        </Card>
    )
}