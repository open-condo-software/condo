import React from 'react'
import { Space } from 'antd'
import { useIntl } from '@open-condo/next/intl'
import { Card, Typography } from '@open-condo/ui'

const SECTION_SPACING = 20
const LABEL_SPACING = 4

type SectionProps = {
    label: string
    value: string
}

type DeveloperCardProps = {
    developer: string
    publishedAt: string
    partnerUrl?: string
}

const Section: React.FC<SectionProps> = ({ label, value }) => {
    return (
        <Space direction='vertical' size={LABEL_SPACING}>
            <Typography.Text size='medium' type='secondary'>{label}</Typography.Text>
            <Typography.Text>{value}</Typography.Text>
        </Space>
    )
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ developer, publishedAt, partnerUrl }) => {
    const intl = useIntl()
    const DeveloperLabel = intl.formatMessage({ id: 'miniapps.developerCard.developer' })
    const PublishedLabel = intl.formatMessage({ id: 'miniapps.developerCard.publishedAt' })
    const PartnerLabel = intl.formatMessage({ id: 'miniapps.developerCard.partnerSite' })
    const publishDate = intl.formatDate(publishedAt)
    return (
        <Card>
            <Space direction='vertical' size={SECTION_SPACING}>
                <Section label={DeveloperLabel} value={developer}/>
                <Section label={PublishedLabel} value={publishDate}/>
                {Boolean(partnerUrl) && (
                    <Typography.Link href={partnerUrl} target='_blank'>{PartnerLabel}</Typography.Link>
                )}
            </Space>
        </Card>
    )
}