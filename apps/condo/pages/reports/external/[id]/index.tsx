import React from 'react'
import { useRouter } from 'next/router'
import { Row, Col, Typography } from 'antd'
import { useIntl } from '@condo/next/intl'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ExternalReport } from '@condo/domains/analytics/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'

const LAYOUT_STYLE: React.CSSProperties = { height: '100%' }
const IFRAME_STYLE: React.CSSProperties = { border: 'none', width: '100%', height: '100%' }

const ExternalReportDetailPage = () => {
    const intl = useIntl()
    const NoDataTitle = intl.formatMessage({ id: 'NoData' })

    const { query: { id } } = useRouter()

    const {
        obj: externalReport, loading,
    } = ExternalReport.useObject({
        where: {
            id: id as string,
        },
    }, { fetchPolicy: 'network-only' })

    return (
        <>
            <PageWrapper>
                {loading
                    ? <Loader size='large' fill />
                    : (
                        <>
                            <PageHeader title={<Typography.Title>{externalReport.title}</Typography.Title>} />
                            <PageContent>
                                <Row style={LAYOUT_STYLE}>
                                    <Col span={24} style={LAYOUT_STYLE}>
                                        {!externalReport.iframeUrl
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
