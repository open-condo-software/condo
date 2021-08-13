import React, { useState } from 'react'
import { notification, Row, Statistic, Typography } from 'antd'
import { StatsContainer } from '@condo/domains/common/components/StatsContainer'
import { StatsCard } from '@condo/domains/common/components/StatsCard'
import { GrowthPanel } from '@condo/domains/common/components/GrowthPanel'
import { useOrganization } from '@core/next/organization'
import { get } from 'lodash'
import { GET_TICKET_WIDGET_REPORT_DATA } from '@condo/domains/ticket/gql'
import { useLazyQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { TicketReportData } from '../../../schema'

export const TicketsWidget = () => {
    const intl = useIntl()
    const NoDataTitle = intl.formatMessage({ id: 'NoData' })
    const TicketsWidgetTitle = intl.formatMessage({ id: 'component.ticketswidget.Title' })
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const [ticketData, setTicketData] = useState<TicketReportData[]>([])
    const [loading, setLoading] = useState(false)

    const [loadTicketsWidgetData] = useLazyQuery(GET_TICKET_WIDGET_REPORT_DATA, {
        onError: error => {
            setLoading(false)
            notification.error(error)
            setTicketData(null)
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
        <StatsCard
            title={TicketsWidgetTitle}
            link='/reports/detail/report_by_tickets'
            onFilterChange={filterChange}
            loading={loading}
            dependencyArray={[userOrganizationId]}>
            <Row gutter={[40, 20]} justify={'center'}>
                {
                    ticketData === null ?
                        <BasicEmptyListView>
                            <Typography.Text>{NoDataTitle}</Typography.Text>
                        </BasicEmptyListView> :
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
