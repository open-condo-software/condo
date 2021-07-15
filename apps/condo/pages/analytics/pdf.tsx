import React, { useEffect, useRef, useState } from 'react'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Col, notification, Row, Typography } from 'antd'
import dynamic from 'next/dynamic'
import { useIntl } from '@core/next/intl'
import { TicketAnalyticsPageChartView, TicketAnalyticsPageListView } from './index'
import { useLazyQuery } from '@core/next/apollo'
import { GET_TICKET_ANALYTICS_REPORT_DATA } from '@condo/domains/ticket/gql'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { createPdf } from '@condo/domains/common/utils/pdf'
import moment from 'moment'

const PdfView = () => {
    const intl = useIntl()
    const containerRef = useRef<null | HTMLDivElement>(null)
    const queryParamsRef = useRef(null)
    const PageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const AllAddresses = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllAddresses' })
    const AllCategories = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllCategories' })
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const [loadTicketAnalyticsData] = useLazyQuery(GET_TICKET_ANALYTICS_REPORT_DATA, {
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
            const { result: { data } } = response
            setData(data)
        },
    })

    useEffect(() => {
        const queryParams = getQueryParams()
        queryParamsRef.current = queryParams
        loadTicketAnalyticsData({ variables: {
            data: {
                ...queryParams,
                addressList: JSON.parse(queryParams.addressList),
                userOrganizationId,
            },
        } })
    }, [userOrganizationId])

    useEffect(() => {
        if (!loading && data !== null) {
            createPdf({ element: containerRef.current, fileName: 'analytics_result.pdf', format: 'a4' })
                .catch((e) => {
                    notification.error({
                        message: intl.formatMessage(({ id: 'errors.PdfGenerationError' })),
                        description: e.message,
                    })
                })
        }
    }, [loading, data])

    if (queryParamsRef.current === null) {
        return null
    }
    const { dateFrom, dateTo, viewMode } = queryParamsRef.current
    return <>
        <Row ref={containerRef} gutter={[0, 40]}>
            <Col span={24}>
                <Typography.Title level={3}>{PageTitle}</Typography.Title>
                <Typography.Title level={4}>
                    Обычные заявки за {moment(dateFrom).format('DD.MM.YYYY')} - {moment(dateTo).format('DD.MM.YYYY')} {AllAddresses} {AllCategories}
                </Typography.Title>
                <TicketAnalyticsPageChartView
                    data={data}
                    viewMode={viewMode}
                    onChartReady={() => setLoading(false)}
                    chartHeight={800}
                />
            </Col>
            <Col span={24}>
                <TicketAnalyticsPageListView data={data} viewMode={viewMode} />
            </Col>
        </Row>
    </>
}

const DynamicPdfView = dynamic(() => Promise.resolve(PdfView), { ssr: false })

const AnalyticsPdfPage = () => (
    <OrganizationRequired>
        <DynamicPdfView />
    </OrganizationRequired>
)

AnalyticsPdfPage.container = ({ children }) => (
    <Typography.Paragraph style={{ padding: 40 }}>{children}</Typography.Paragraph>
)

export default AnalyticsPdfPage
