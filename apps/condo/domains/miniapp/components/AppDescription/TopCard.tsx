import React, { CSSProperties } from 'react'
import get from 'lodash/get'
import { Col, Row, Space, Image } from 'antd'
import type { RowProps } from 'antd'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Tag, Carousel } from '@open-condo/ui'
import { LABEL_TO_TAG_PROPS } from '@condo/domains/miniapp/constants'

const ROW_GUTTER: RowProps['gutter'] = [40, 40]
const COL_SPAN_HALF = 12
const BUTTON_SPACING = 60
const TEXT_SPACING = 24
const TAG_SPACING = 8
const IMAGE_STYLES: CSSProperties = { width: '100%', height: 400, objectFit: 'cover' }
const IMAGE_WRAPPER_STYLES: CSSProperties = { borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }
const VERT_ALIGN_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'center' }

type TopCardProps = {
    name: string
    category: string
    label?: string
    description: string
    price?: string
    gallery?: Array<string>
}

export const TopCard: React.FC<TopCardProps> = ({
    name,
    category,
    label,
    description,
    price,
    gallery,
}) => {
    const intl = useIntl()
    const CategoryMessage = intl.formatMessage({ id: `miniapps.categories.${category}.name` })
    const LabelMessage = label && intl.formatMessage({ id: `miniapps.labels.${label}.name` })

    const labelTagProps = label && get(LABEL_TO_TAG_PROPS, label, {})
    const images = gallery || []

    return (
        <Row gutter={ROW_GUTTER}>
            <Col span={COL_SPAN_HALF} style={VERT_ALIGN_STYLES}>
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
            <Col span={COL_SPAN_HALF} style={VERT_ALIGN_STYLES}>
                {Boolean(images.length) && (
                    <Carousel
                        slidesToShow={1}
                        autoplay
                        infinite
                    >
                        {images.map((src, idx) => (
                            <Image
                                style={IMAGE_STYLES}
                                wrapperStyle={IMAGE_WRAPPER_STYLES}
                                key={idx}
                                src={src}
                                preview={false}
                            />
                        ))}
                    </Carousel>
                )}
            </Col>
        </Row>
    )
}