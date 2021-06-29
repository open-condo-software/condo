import React from 'react'
import { Row, Statistic } from 'antd'
import { StatsContainer } from './StatsContainer'
import { StatsCard } from './StatsCard'
import { GrowthPanel } from './GrowthPanel'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { get } from 'lodash'

export const RequestsWidget = () => {
    // TODO: add request data
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const where = { organization: { id: userOrganizationId } }
    const { loading, objs } = Ticket.useObjects({ where })
    const mockData = [
        {
            title: 'Открыто',
            value: 360,
            percent: 33.67,
        },
        {
            title: 'В работе',
            value: 117,
            percent: -20.44,
        },
        {
            title: 'Отмененная',
            value: 117,
            percent: -20.44,
        },
        {
            title: 'Отложененная',
            value: 117,
            percent: -20.44,
        },
        {
            title: 'Выполненные',
            value: 117,
            percent: -20.44,
        },
        {
            title: 'Закрытые',
            value: 117,
            percent: -20.44,
        },
    ]

    return (
        <StatsCard title='Заявки за' link='/' loading={loading}>
            <Row gutter={[40, 20]}>
                {
                    mockData.map((e, i) => (
                        <StatsContainer key={i}>
                            <Statistic
                                title={e.title}
                                prefix={<span style={{ fontSize: 30, fontWeight: 600 }}>{e.value}</span>}
                                valueRender={() => <GrowthPanel value={e.percent}  />}
                            />
                        </StatsContainer>
                    ))
                }
            </Row>
        </StatsCard>
    )
}
