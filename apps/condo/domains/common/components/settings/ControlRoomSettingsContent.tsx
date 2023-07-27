import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import React  from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { CardsContainer } from '@condo/domains/common/components/Card/CardsContainer'
import { SettingCardSkeleton } from '@condo/domains/common/components/settings/SettingCard'
import { TicketDeadlineSettingCard } from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingCard'
import { TicketOrganizationSetting as TicketSetting } from '@condo/domains/ticket/utils/clientSchema'

const CONTENT_GUTTER: Gutter | [Gutter, Gutter] = [0, 40]

export const ControlRoomSettingsContent: React.FC = () => {
    const intl = useIntl()
    const ControlRoomTitle = intl.formatMessage({ id: 'controlRoom' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const { obj: ticketSetting, loading } = TicketSetting.useObject({
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
                    {
                        loading
                            ? <SettingCardSkeleton />
                            : <TicketDeadlineSettingCard ticketSetting={ticketSetting} />
                    }
                </CardsContainer>
            </Col>
        </Row>
    )
}
