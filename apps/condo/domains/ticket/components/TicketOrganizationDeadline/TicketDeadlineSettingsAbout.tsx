import React  from 'react'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Link from 'next/link'

import { useIntl } from '@condo/next/intl'
import { TicketDeadlinePreview } from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlinePreview'
import { colors } from '@condo/domains/common/constants/style'

const MIDDLE_ROW_GUTTERS: [Gutter, Gutter] = [0, 40]
const SMALL_ROW_GUTTERS: [Gutter, Gutter] = [0, 20]
const LINK_STYLE = { color: colors.black }

export const TicketDeadlineSettingsAbout: React.FC = () => {
    const intl = useIntl()
    const DescriptionLabel = intl.formatMessage({ id: 'Description' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.about.description.message' })
    const LinkLabel = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.about.link.label' })
    const LinkMessage = intl.formatMessage({ id: 'pages.condo.settings.ticketDeadlines.about.link.message' })

    return (
        <Row gutter={MIDDLE_ROW_GUTTERS}>
            <Col span={24}>
                <TicketDeadlinePreview/>
            </Col>
            <Col span={24}>
                <Row gutter={SMALL_ROW_GUTTERS}>
                    <Col span={24}>
                        <Row>
                            <Col span={6}>
                                <Typography.Text type='secondary'>{DescriptionLabel}</Typography.Text>
                            </Col>
                            <Col span={18}>
                                <Typography.Text>{DescriptionMessage}</Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row>
                            <Col span={6}>
                                <Typography.Text type='secondary'>{LinkLabel}</Typography.Text>
                            </Col>
                            <Col span={18}>
                                <Link href='/ticket/create'>
                                    <Typography.Link style={LINK_STYLE} underline href='/ticket/create' target='_blank'>
                                        {LinkMessage}
                                    </Typography.Link>
                                </Link>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}