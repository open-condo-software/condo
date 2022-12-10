import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Link from 'next/link'
import React  from 'react'

import { useIntl } from '@open-condo/next/intl'

import { colors } from '@condo/domains/common/constants/style'
import { TicketDeadlinePreview } from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlinePreview'

const MIDDLE_ROW_GUTTERS: [Gutter, Gutter] = [0, 40]
const SMALL_ROW_GUTTERS: [Gutter, Gutter] = [0, 20]
const LINK_STYLE = { color: colors.black }

export const TicketDeadlineSettingsAbout: React.FC = () => {
    const intl = useIntl()
    const DescriptionLabel = intl.formatMessage({ id: 'Description' })
    const LinkMessage = intl.formatMessage({ id: 'settings.ticketDeadlines.about.description.link.message' })
    const DescriptionMessage = intl.formatMessage(
        { id: 'settings.ticketDeadlines.about.description.message' },
        {
            link: (
                <Link href='/ticket/create'>
                    <Typography.Link style={LINK_STYLE} underline href='/ticket/create' target='_blank'>
                        {LinkMessage}
                    </Typography.Link>
                </Link>
            ),
        })

    return (
        <Row gutter={MIDDLE_ROW_GUTTERS}>
            <Col span={24}>
                <TicketDeadlinePreview/>
            </Col>
            <Col span={24}>
                <Row gutter={SMALL_ROW_GUTTERS}>
                    <Col span={24}>
                        <Row>
                            <Col span={24} md={5}>
                                <Typography.Text type='secondary'>{DescriptionLabel}</Typography.Text>
                            </Col>
                            <Col span={24} md={19}>
                                <Typography.Text>{DescriptionMessage}</Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}