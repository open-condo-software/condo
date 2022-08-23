import React from 'react'
import { useRouter } from 'next/router'
import { Row, Col, Typography } from 'antd'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ExternalReport } from '@condo/domains/analytics/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'

const LAYOUT_STYLE: React.CSSProperties = { height: '100%' }
const IFRAME_STYLE: React.CSSProperties = { border: 'none', width: '100%', height: '100%' }

const ExternalReportDetailPage = () => {
    const { asPath } = useRouter()

    const {
        obj: externalReport, loading,
    } = ExternalReport.useObject({
        where: {
            id: asPath.split('/').pop(),
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
                                        <iframe
                                            src={externalReport.iframeUrl}
                                            style={IFRAME_STYLE}
                                        />
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
