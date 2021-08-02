import React, { useEffect, useRef, useState } from 'react'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Col, notification, Row, Typography } from 'antd'
import dynamic from 'next/dynamic'
import { useIntl } from '@core/next/intl'
import { TicketAnalyticsPageChartView, TicketAnalyticsPageListView } from './index'
import { useLazyQuery } from '@core/next/apollo'
import { TICKET_ANALYTICS_REPORT_MUTATION } from '@condo/domains/ticket/gql'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { createPdf } from '@condo/domains/common/utils/pdf'
import moment from 'moment'

const PdfView = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const AllAddresses = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllAddresses' })
    const SingleAddress = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.SingleAddress' })
    const AllCategories = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllCategories' })
    const DefaultTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.DefaultTickets' })
    const PaidTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PaidTickets' })
    const EmergencyTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.EmergencyTickets' })
    const containerRef = useRef<null | HTMLDivElement>(null)
    const queryParamsRef = useRef(null)

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const [loadTicketAnalyticsData] = useLazyQuery(TICKET_ANALYTICS_REPORT_MUTATION, {
        onError: (error) => {
            console.log(error)
            notification.error({
                message: intl.formatMessage({ id: 'errors.PdfGenerationError' }),
                description: error,
            })
            setLoading(false)
        },
        fetchPolicy: 'network-only',
        onCompleted: (response) => {
            const {
                result: { result },
            } = response
            setData(result)
        },
    })
    useEffect(() => {
        const queryParams = getQueryParams()
        queryParamsRef.current = queryParams
        const groupBy = []
        if (queryParams.viewMode === 'line') {
            groupBy.push(...['status', queryParams.specification])
        } else {
            groupBy.push(...['status', 'property'])
        }
        const addressList = JSON.parse(queryParams.addressList)
        const AND: unknown[] = [
            { organization: { id: userOrganizationId } },
            { isEmergency: queryParams.ticketType === 'emergency' },
            { isPaid: queryParams.ticketType === 'paid' },
            { createdAt_gte: queryParams.dateFrom },
            { createdAt_lte: queryParams.dateTo },
        ]
        if (addressList.length) {
            AND.push({ property: { id_in: addressList.map(({ id }) => id) } })
        }
        loadTicketAnalyticsData({ variables: { data: { groupBy, where: { AND } } } })
    }, [userOrganizationId])

    useEffect(() => {
        if (!loading && data !== null) {
            createPdf({ element: containerRef.current, fileName: 'analytics_result.pdf', format: 'a4' }).catch((e) => {
                notification.error({
                    message: intl.formatMessage({ id: 'errors.PdfGenerationError' }),
                    description: e.message,
                })
            })
        }
    }, [loading, data])

    if (queryParamsRef.current === null) {
        return null
    }
    let ticketTypeTitle = DefaultTickets
    const { dateFrom, dateTo, viewMode, ticketType, addressList, specification } = queryParamsRef.current
    ticketType === 'paid' && (ticketTypeTitle = PaidTickets)
    ticketType === 'emergency' && (ticketTypeTitle = EmergencyTickets)
    const addressListParsed = JSON.parse(addressList)
    const addressFilterTitle = addressListParsed.length ? `${SingleAddress} «${addressListParsed[0].value}»` : AllAddresses
    return (
        <>
            <Row ref={containerRef} gutter={[0, 40]}>
                <Col span={24}>
                    <Typography.Title level={3}>{PageTitle}</Typography.Title>
                    <Typography.Title level={4}>
                        {ticketTypeTitle} {moment(dateFrom).format('DD.MM.YYYY')} - {moment(dateTo).format('DD.MM.YYYY')}{' '}
                        {addressFilterTitle} {AllCategories}
                    </Typography.Title>
                    <TicketAnalyticsPageChartView
                        data={data}
                        viewMode={viewMode}
                        onChartReady={() => setLoading(false)}
                        chartHeight={800}
                    />
                </Col>
                <Col span={24}>
                    <TicketAnalyticsPageListView
                        data={data}
                        viewMode={viewMode}
                        filters={{
                            range: [dateFrom, dateTo],
                            addressList: addressListParsed,
                            specification: specification,
                        }}
                    />
                </Col>
            </Row>
        </>
    )
}

const DynamicPdfView = dynamic(() => Promise.resolve(PdfView), { ssr: false })

const AnalyticsPdfPage = () => (
    <OrganizationRequired>
        <DynamicPdfView />
    </OrganizationRequired>
)

AnalyticsPdfPage.container = ({ children }) => <Typography.Paragraph style={{ padding: 40 }}>{children}</Typography.Paragraph>

export default AnalyticsPdfPage
