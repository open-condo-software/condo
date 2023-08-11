import { useLazyQuery } from '@apollo/client'
import { GetExternalReportIframeUrlOutput } from '@app/condo/schema'
import { Row, Col, Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { GET_EXTERNAL_REPORT_IFRAME_URL_QUERY } from '@condo/domains/analytics/gql'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const LAYOUT_STYLE: React.CSSProperties = { height: '100%' }
const IFRAME_STYLE: React.CSSProperties = { border: 'none', width: '100%', height: '100%' }

const ExternalReportDetailPage = () => {
    const intl = useIntl()
    const NoDataTitle = intl.formatMessage({ id: 'noData' })
    const DefaultPageTitle = intl.formatMessage({ id: 'analytics.index.pageTitle' })

    const [externalReport, setExternalReport] = useState<GetExternalReportIframeUrlOutput>(null)

    const { query: { id } } = useRouter()

    const { organization: { id: organizationId } } = useOrganization()

    const [loadExternalReport, { loading }] = useLazyQuery(GET_EXTERNAL_REPORT_IFRAME_URL_QUERY, {
        fetchPolicy: 'network-only',
        onCompleted: (data) => {
            setExternalReport(data.result)
        },
    })

    useEffect(() => {
        if (id && organizationId) {
            loadExternalReport({ variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    id,
                    organizationId,
                },
            } })
        }
    }, [id, organizationId])

    return (
        <>
            <PageWrapper>
                {loading
                    ? <Loader size='large' fill />
                    : (
                        <>
                            <PageHeader title={<Typography.Title>{get(externalReport, 'title', DefaultPageTitle)}</Typography.Title>} />
                            <PageContent>
                                <Row style={LAYOUT_STYLE}>
                                    <Col span={24} style={LAYOUT_STYLE}>
                                        {!get(externalReport, 'iframeUrl')
                                            ? (
                                                <BasicEmptyListView image='/dino/searching@2x.png'>
                                                    <Typography.Title level={4}>
                                                        {NoDataTitle}
                                                    </Typography.Title>
                                                </BasicEmptyListView>
                                            )
                                            : <iframe
                                                src={externalReport.iframeUrl}
                                                style={IFRAME_STYLE}
                                            />
                                        }
                                    </Col>
                                </Row>
                            </PageContent>
                        </>
                    )
                }
            </PageWrapper>
        </>
    )
}

ExternalReportDetailPage.requiredAccess = OrganizationRequired

export default ExternalReportDetailPage
