import React from 'react'
import get from 'lodash/get'
import { Col, Row, Space } from 'antd'
import type { RowProps } from 'antd'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Tag } from '@open-condo/ui'
import { LABEL_TO_TAG_PROPS } from '@condo/domains/miniapp/constants'

const ROW_GUTTER: RowProps['gutter'] = [40, 40]
const COL_SPAN_HALF = 12
const BUTTON_SPACING = 60
const TEXT_SPACING = 24
const TAG_SPACING = 8

type TopCardProps = {
    name: string
    category: string
    label?: string
    description: string
    price?: string
}

export const TopCard: React.FC<TopCardProps> = ({
    name,
    category,
    label,
    description,
    price,
}) => {
    const intl = useIntl()
    const CategoryMessage = intl.formatMessage({ id: `miniapps.categories.${category}.name` })
    const LabelMessage = label && intl.formatMessage({ id: `miniapps.labels.${label}.name` })

    const labelTagProps = label && get(LABEL_TO_TAG_PROPS, label, {})

    return (
        <Row gutter={ROW_GUTTER}>
            <Col span={COL_SPAN_HALF}>
                <Space direction='vertical' size={BUTTON_SPACING}>
                    <Space direction='vertical' size={TEXT_SPACING}>
                        <Space direction='horizontal' size={TAG_SPACING}>
                            <Tag>{CategoryMessage}</Tag>
                            {Boolean(label) && (
                                <Tag {...labelTagProps}>{LabelMessage}</Tag>
                            )}
                        </Space>
                        <Typography.Title level={1}>
                            {name}
                        </Typography.Title>
                        <Typography.Paragraph type='secondary'>
                            {description}
                        </Typography.Paragraph>
                        {Boolean(price) && (
                            <Typography.Title level={3}>
                                {price}
                            </Typography.Title>
                        )}
                    </Space>
                </Space>
            </Col>
            <Col span={COL_SPAN_HALF}>
                456
            </Col>
        </Row>
    )
}