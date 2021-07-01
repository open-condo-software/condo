import React, { useState } from 'react'
import { Row, Statistic } from 'antd'
import { StatsContainer } from './StatsContainer'
import { StatsCard } from './StatsCard'
import { GrowthPanel } from './GrowthPanel'
import { useOrganization } from '@core/next/organization'
import { get } from 'lodash'
import { GET_TICKET_WIDGET_REPORT_DATA } from '@condo/domains/ticket/gql'
import { useLazyQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'

export const TicketsWidget = () => {
    const intl = useIntl()
    const ticketsWidgetTitle = intl.formatMessage({ id: 'component.ticketswidget.Title' })
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const [ticketData, setTicketData] = useState([])
    const [loading, setLoading] = useState(false)

    const [loadTicketsWidgetData] = useLazyQuery(GET_TICKET_WIDGET_REPORT_DATA, {
        onError: error => {
            setLoading(false)
            console.error(error)
        },
        fetchPolicy: 'cache-and-network',
        onCompleted: (response) => {
            const { result: { data } } = response
            setTicketData(data)
            setLoading(false)
        },
    })

    const filterChange = (filter: string) => {
        setLoading(true)
        loadTicketsWidgetData({ variables: { data: { periodType: filter, offset: 0, userOrganizationId } } })
    }

    return (
        <StatsCard title={ticketsWidgetTitle} link='/' onFilterChange={filterChange} loading={loading} dependencyArray={[userOrganizationId]}>
            <Row gutter={[40, 20]}>
                {
                    ticketData.map((e, i) => (
                        <StatsContainer key={i}>
                            <Statistic
                                title={e.statusName}
                                prefix={<span style={{ fontSize: 30, fontWeight: 600 }}>{e.currentValue}</span>}
                                valueRender={() => <GrowthPanel value={e.growth}  />}
                            />
                        </StatsContainer>
                    ))
                }
            </Row>
        </StatsCard>
    )
}
