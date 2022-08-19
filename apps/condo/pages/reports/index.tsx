import React from 'react'
import Head from 'next/head'
import { Typography, Row, Col, RowProps } from 'antd'
import { useIntl } from '@condo/next/intl'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { useOrganization } from '@condo/next/organization'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import ExternalReportCard from '@condo/domains/analytics/components/ExternalReportCard'
import { ExternalReport } from '@condo/domains/analytics/utils/clientSchema/index'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'

const EXTERNAL_REPORT_ROW_GUTTER: RowProps['gutter'] = [32, 40]

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.analytics.index.PageTitle' })

    const { organization } = useOrganization()

    const {
        objs: externalReports, loading,
    } = ExternalReport.useObjects({
        where: {
            OR: [
                { organization_is_null: true },
                { organization: { id: get(organization, 'id') } },
            ],
        },
    }, { fetchPolicy: 'network-only' })

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader style={{ background: 'transparent' }} title={<Typography.Title>{PageTitleMsg}</Typography.Title>}/>
                <PageContent>
                    <Row gutter={EXTERNAL_REPORT_ROW_GUTTER}>
                        {loading
                            ? <Loader size='large' fill />
                            : (externalReports.map((externalReport, key) => (
                                <Col key={key} span={12}>
                                    <ExternalReportCard externalReport={externalReport} />
                                </Col>
                            )))
                        }
                        {(!loading && isEmpty(externalReports)) && (
                            <BasicEmptyListView />
                        )}
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
