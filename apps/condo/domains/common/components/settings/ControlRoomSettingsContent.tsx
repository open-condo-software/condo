import React  from 'react'
import { Col, Row, Typography } from 'antd'
import get from 'lodash/get'
import { Gutter } from 'antd/es/grid/row'

import { useIntl } from '@condo/next/intl'
import { useOrganization } from '@condo/next/organization'
import { CardsContainer } from '@condo/domains/common/components/Card/CardsContainer'
import { TicketOrganizationSetting as TicketSetting } from '@condo/domains/ticket/utils/clientSchema'
import { TicketDeadlineSettingCard } from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingCard'

const CONTENT_GUTTER: Gutter | [Gutter, Gutter] = [0, 40]

export const ControlRoomSettingsContent: React.FC = () => {
    const intl = useIntl()
    const ControlRoomTitle = intl.formatMessage({ id: 'ControlRoom' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const { obj: ticketSetting } = TicketSetting.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })

    return (
        <Row gutter={CONTENT_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{ControlRoomTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <CardsContainer autosize>
                    <TicketDeadlineSettingCard ticketSetting={ticketSetting} />
                </CardsContainer>
            </Col>
        </Row>
    )
}
