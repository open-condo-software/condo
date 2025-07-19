import { CardProps, Col, Row, Typography, Skeleton } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { EllipsisConfig } from 'antd/es/typography/Base'
import React from 'react'

import { Card } from '@condo/domains/common/components/Card/Card'


type SettingCardProps = Pick<CardProps, 'onClick'> & {
    title: string
    disabled?: boolean
}

const CARD_STYLE: React.CSSProperties = { height: 216 }
const TITLE_ELLIPSIS: boolean | EllipsisConfig = { rows: 2 }
const PARAGRAPH_ELLIPSIS: boolean | EllipsisConfig = { rows: 5 }
const CARD_GUTTER: Gutter | [Gutter, Gutter] = [0, 12]

export const SettingCard: React.FC<React.PropsWithChildren<SettingCardProps>> = ({ title, children, onClick, disabled }) => {
    return (
        <Card style={CARD_STYLE} onClick={onClick} disabled={disabled}>
            <Row gutter={CARD_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={5} ellipsis={TITLE_ELLIPSIS}>
                        {title}
                    </Typography.Title>
                </Col>
                <Col span={24}>
                    <Typography.Paragraph ellipsis={PARAGRAPH_ELLIPSIS}>
                        {children}
                    </Typography.Paragraph>
                </Col>
            </Row>
        </Card>
    )
}

export const SettingCardSkeleton: React.FC = () => {
    return (
        <Card style={CARD_STYLE}>
            <Skeleton />
        </Card>
    )
}
