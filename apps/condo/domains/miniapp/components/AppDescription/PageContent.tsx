import React from 'react'
import { Row, Col } from 'antd'
import type { RowProps, ColProps } from 'antd'
import { Markdown } from '@open-condo/ui'
import { TopCard } from './TopCard'
import { DeveloperCard } from './DeveloperCard'

const SECTION_SPACING: RowProps['gutter'] = [40, 60]
const FULL_COL_SPAN: ColProps['span'] = 24

type PageContentProps = {
    name: string
    category: string
    label?: string
    shortDescription: string
    detailedDescription: string
    price?: string
    developer: string
    publishedAt: string
    partnerUrl?: string
}

export const PageContent: React.FC<PageContentProps> = ({
    name,
    category,
    label,
    shortDescription,
    detailedDescription,
    price,
    developer,
    publishedAt,
    partnerUrl,
}) => {
    const contentSpan = 18
    const developerSpan = (FULL_COL_SPAN - contentSpan) || FULL_COL_SPAN

    return (
        <Row gutter={SECTION_SPACING}>
            <Col span={FULL_COL_SPAN}>
                <TopCard
                    name={name}
                    category={category}
                    label={label}
                    description={shortDescription}
                    price={price}
                />
            </Col>
            <Col span={contentSpan}>
                <Markdown>
                    {detailedDescription}
                </Markdown>
            </Col>
            <Col span={developerSpan}>
                <DeveloperCard
                    developer={developer}
                    publishedAt={publishedAt}
                    partnerUrl={partnerUrl}
                />
            </Col>
            <Col span={FULL_COL_SPAN}>
                Footer
            </Col>
        </Row>
    )
}