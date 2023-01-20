import { Typography, Row, Col, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import ExternalReportCard from '@condo/domains/analytics/components/ExternalReportCard'
import { ExternalReport } from '@condo/domains/analytics/utils/clientSchema/index'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const EXTERNAL_REPORT_ROW_GUTTER: RowProps['gutter'] = [32, 40]

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.analytics.index.PageTitle' })
    const NoDataTitle = intl.formatMessage({ id: 'NoData' })

    const { organization } = useOrganization()

    const {
        objs: externalReports, loading,
    } = ExternalReport.useObjects({
        where: {
            isHidden: false,
            OR: [
                { organization_is_null: true },
                { organization: { id: get(organization, 'id') } },
            ],
        },
    }, { fetchPolicy: 'network-only' })

    const isEmptyReports = !loading && isEmpty(externalReports)

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitleMsg}</Typography.Title>} />
                <PageContent>
                    <Row
                        gutter={EXTERNAL_REPORT_ROW_GUTTER}
                        align={isEmptyReports ? 'middle' : 'top'}
                        style={{ height: isEmptyReports ? '100%' : 'initial' }}
                    >
                        {loading
                            ? <Loader size='large' fill />
                            : (externalReports
                                .map((externalReport, key) => (
                                    <Col key={key} lg={12} md={24} xs={24} sm={24}>
                                        <ExternalReportCard externalReport={externalReport} />
                                    </Col>
                                )))
                        }
                        {isEmptyReports && (
                            <BasicEmptyListView image='/dino/searching@2x.png' spaceSize={16}>
                                <Typography.Title level={4}>{NoDataTitle}</Typography.Title>
                            </BasicEmptyListView>
                        )}
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
