import React, { useEffect, useRef, useState } from 'react'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Col, notification, Row, Typography } from 'antd'
import dynamic from 'next/dynamic'
import { useIntl } from '@core/next/intl'
import {
    TicketAnalyticsPageChartView, TicketAnalyticsPageListView,
} from './index'
import { useLazyQuery } from '@core/next/apollo'
import { TICKET_ANALYTICS_REPORT_MUTATION } from '@condo/domains/ticket/gql'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { createPdfWithPageBreaks } from '@condo/domains/common/utils/pdf'
import moment from 'moment'
import { filterToQuery } from '@condo/domains/ticket/utils/helpers'
import { Loader } from '@condo/domains/common/components/Loader'
import { PDF_REPORT_WIDTH } from '@condo/domains/ticket/constants/common'
import { Logo } from '@condo/domains/common/components/Logo'
import { colors } from '@condo/domains/common/constants/style'

const PdfView = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const AllAddresses = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllAddresses' })
    const SingleAddress = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.SingleAddress' })
    const AllCategories = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllCategories' })
    const DefaultTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.DefaultTickets' })
    const PaidTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PaidTickets' })
    const EmergencyTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.EmergencyTickets' })
    const LoadingTip = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PDF.LoadingTip' })
    const containerRef = useRef<null | HTMLDivElement>(null)
    const queryParamsRef = useRef(null)

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const [loadTicketAnalyticsData] = useLazyQuery(TICKET_ANALYTICS_REPORT_MUTATION, {
        onError: error => {
            console.log(error)
            notification.error({
                message: intl.formatMessage(({ id: 'errors.PdfGenerationError' })),
                description: error,
            })
            setLoading(false)
        },
        fetchPolicy: 'network-only',
        onCompleted: response => {
            setLoading(false)
            const { result: { result } } = response
            setData(result)
        },
    })
    useEffect(() => {
        const queryParams = getQueryParams()
        queryParamsRef.current = queryParams
        const dateFrom = get(queryParams, 'dateFrom', moment().subtract(1, 'week'))
        const dateTo = get(queryParams, 'dateTo', moment())
        const addressList = JSON.parse(get(queryParams, 'addressList', '[]'))
        const specification = get(queryParams, 'specification', 'day')
        const viewMode = get(queryParams, 'viewMode', 'line')
        const ticketType = get(queryParams, 'ticketType', 'all')
        const { AND, groupBy } = filterToQuery(
            {
                range: [moment(dateFrom), moment(dateTo)],
                addressList,
                specification,
            }, viewMode, ticketType
        )
        const where = { organization: { id: userOrganizationId }, AND }

        loadTicketAnalyticsData({ variables: { data: { groupBy, where } } })

    }, [userOrganizationId])

    useEffect(() => {
        if (!loading && data !== null) {
            createPdfWithPageBreaks({ element: containerRef.current, fileName: 'analytics_result.pdf' })
                .catch((e) => {
                    notification.error({
                        message: intl.formatMessage(({ id: 'errors.PdfGenerationError' })),
                        description: e.message,
                    })
                })
        }
    }, [loading, data])

    if (queryParamsRef.current === null ) {
        return null
    }
    let ticketTypeTitle = DefaultTickets
    const { dateFrom, dateTo, viewMode, ticketType, addressList, specification } = queryParamsRef.current
    ticketType === 'paid' && (ticketTypeTitle = PaidTickets)
    ticketType === 'emergency' && (ticketTypeTitle = EmergencyTickets)
    const addressListParsed = JSON.parse(addressList)
    const addressFilterTitle = addressListParsed.length ? `${SingleAddress} «${addressListParsed[0].value}»` : AllAddresses
    return <>
        {loading && <Loader fill spinning tip={LoadingTip} /> }
        <Row ref={containerRef} gutter={[0, 40]} style={{ width: PDF_REPORT_WIDTH, paddingLeft: 80, paddingRight: 120 }}>
            <Col flex={1} style={{ visibility: loading ? 'hidden' : 'visible', position: 'relative' }}>
                <Typography.Paragraph style={{ position: 'absolute', top: 0, right: 0 }}>
                    <Logo onClick={undefined} fillColor={colors.lightGrey[6]} />
                </Typography.Paragraph>
                <Typography.Title level={3}>{PageTitle}</Typography.Title>
                <Typography.Title level={4}>
                    {ticketTypeTitle} {moment(dateFrom).format('DD.MM.YYYY')} - {moment(dateTo).format('DD.MM.YYYY')} {addressFilterTitle} {AllCategories}
                </Typography.Title>
                <TicketAnalyticsPageChartView
                    data={data}
                    viewMode={viewMode}
                    onChartReady={() => setLoading(false)}
                    chartConfig={{
                        animationEnabled: false,
                        chartOptions: { renderer: 'svg' },
                    }}
                />
            </Col>
            <Col flex={1} >
                <TicketAnalyticsPageListView data={data} viewMode={viewMode} filters={{
                    range: [dateFrom, dateTo],
                    addressList: addressListParsed,
                    specification: specification,
                }} />
            </Col>
        </Row>
    </>
}

const DynamicPdfView = dynamic(() => Promise.resolve(PdfView), { ssr: false })

const AnalyticsPdfPage = () => (
    <DynamicPdfView />
)

AnalyticsPdfPage.container = ({ children }) => (
    <Typography.Paragraph style={{ padding: 40 }}>{children}</Typography.Paragraph>
)
AnalyticsPdfPage.requiredAccess = OrganizationRequired

export default AnalyticsPdfPage
