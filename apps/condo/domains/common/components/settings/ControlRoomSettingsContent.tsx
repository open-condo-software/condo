import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React  from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { CardsContainer } from '@condo/domains/common/components/Card/CardsContainer'
import { SettingCard, SettingCardSkeleton } from '@condo/domains/common/components/settings/SettingCard'
import { PropertyScope } from '@condo/domains/scope/utils/clientSchema'
import { TicketDeadlineSettingCard } from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketDeadlineSettingCard'
import { TicketOrganizationSetting as TicketSetting, TicketPropertyHint } from '@condo/domains/ticket/utils/clientSchema'


const CONTENT_GUTTER: Gutter | [Gutter, Gutter] = [0, 40]

export const ControlRoomSettingsContent: React.FC = () => {
    const intl = useIntl()
    const ControlRoomTitle = intl.formatMessage({ id: 'ControlRoom' })
    const HintsMessage = intl.formatMessage({ id: 'global.Hints' })
    const CreatedMessage = intl.formatMessage({ id: 'Created' })
    const PropertyScopesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.title' })
    const CountMessage = intl.formatMessage({ id: 'global.count.pieces.short' })

    const router = useRouter()

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const { obj: ticketSetting, loading: ticketSettingsLoading } = TicketSetting.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })
    const { count: propertyScopesCount, loading: propertyScopesLoading } = PropertyScope.useCount({
        where: {
            organization: { id: userOrganizationId },
        },
    })
    const { count: hintsCount, loading: hintsLoading } = TicketPropertyHint.useCount({
        where: {
            organization: { id: userOrganizationId },
        },
    })

    const loading = ticketSettingsLoading || propertyScopesLoading || hintsLoading

    return (
        <Row gutter={CONTENT_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{ControlRoomTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                {
                    loading ? (
                        <CardsContainer autosize>
                            <SettingCardSkeleton />
                        </CardsContainer>
                    ) : (
                        <CardsContainer autosize>
                            <TicketDeadlineSettingCard ticketSetting={ticketSetting} />
                            <SettingCard title={PropertyScopesMessage} onClick={() => router.push('/settings/propertyScope')}>
                                <Typography.Text type='secondary'>{CreatedMessage}: {propertyScopesCount} {CountMessage}</Typography.Text>
                            </SettingCard>
                            <SettingCard title={HintsMessage} onClick={() => router.push('/settings/hint')}>
                                <Typography.Text type='secondary'>{CreatedMessage}: {hintsCount} {CountMessage}</Typography.Text>
                            </SettingCard>
                        </CardsContainer>
                    )
                }
            </Col>
        </Row>
    )
}
