import React, { useState } from 'react'
import { notification, Row, Statistic, Typography } from 'antd'
import { StatsContainer } from '@condo/domains/common/components/StatsContainer'
import { StatsCard } from '@condo/domains/common/components/StatsCard'
import { GrowthPanel } from '@condo/domains/common/components/GrowthPanel'
import { useOrganization } from '@condo/next/organization'
import { get } from 'lodash'
import { GET_TICKET_WIDGET_REPORT_DATA } from '@condo/domains/ticket/gql'
import { useLazyQuery } from '@condo/next/apollo'
import { useIntl } from '@condo/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { TicketReportData } from '@app/condo/schema'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

export const TicketsWidget = () => {
    const intl = useIntl()
    const NoDataTitle = intl.formatMessage({ id: 'NoData' })
    const TicketsWidgetTitle = intl.formatMessage({ id: 'component.ticketswidget.Title' })
    const TicketsWidgetShortTitle = intl.formatMessage({ id: 'component.ticketswidget.Title.Short' })
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const [ticketData, setTicketData] = useState<TicketReportData[]>([])
    const [loading, setLoading] = useState(false)
    const { isSmall } = useLayoutContext()

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
            title={isSmall ? TicketsWidgetShortTitle : TicketsWidgetTitle}
            link='/reports/detail/report-by-tickets'
            onFilterChange={filterChange}
            loading={loading}
            dependencyArray={[userOrganizationId]}
        >
            <Row gutter={[40, 20]} justify={'center'}>
                {
                    ticketData === null
                        ? (
                            <BasicEmptyListView>
                                <Typography.Text>{NoDataTitle}</Typography.Text>
                            </BasicEmptyListView>
                        )
                        : (
                            ticketData.map((e, i) => (
                                <StatsContainer key={i}>
                                    <Statistic
                                        title={e.statusName}
                                        prefix={<span style={{ fontSize: 30, fontWeight: 600 }}>{e.currentValue}</span>}
                                        valueRender={() => <GrowthPanel value={e.growth}  />}
                                    />
                                </StatsContainer>
                            ))
                        )
                }
            </Row>
        </StatsCard>
    )
}
