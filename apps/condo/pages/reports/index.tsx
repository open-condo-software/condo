import { Typography, Row, Col, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo, useEffect } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Dashboard } from '@condo/domains/analytics/components/Dashboard'
import ExternalReportCard from '@condo/domains/analytics/components/ExternalReportCard'
import { ExternalReport } from '@condo/domains/analytics/utils/clientSchema/index'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import { ANALYTICS_V3 } from '@condo/domains/common/constants/featureflags'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
const EXTERNAL_REPORT_ROW_GUTTER: RowProps['gutter'] = [32, 40]

const IndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.analytics.index.PageTitle' })
    const NoDataTitle = intl.formatMessage({ id: 'NoData' })

    const { organization, link } = useOrganization()
    const { useFlag } = useFeatureFlags()
    const { replace } = useRouter()
    const isDashboardEnabled = useFlag(ANALYTICS_V3)

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

    const pageContent = useMemo(() => {
        const canReadAnalytics = get(link, [ 'role', 'canReadAnalytics'], false)

        // NOTE: in case of v3 enabled and user has no access to canReadAnalytics -> show loader and redirect to /ticket
        if (isDashboardEnabled && !canReadAnalytics) {
            return <Loader size='large' />
        }
        // NOTE: v3 enabled and has access canReadAnalytics -> show v3
        if (isDashboardEnabled && canReadAnalytics) {
            return <Dashboard organizationId={organization.id} />
        }

        const isEmptyReports = isEmpty(externalReports)
        // Otherwise show external reports
        return (
            <Row
                gutter={EXTERNAL_REPORT_ROW_GUTTER}
                align={isEmptyReports ? 'middle' : 'top'}
                style={{ height: isEmptyReports ? '100%' : 'initial' }}
            >
                {externalReports
                    .map((externalReport, key) => (
                        <Col key={key} lg={12} md={24} xs={24} sm={24}>
                            <ExternalReportCard externalReport={externalReport} />
                        </Col>
                    ))
                }

                {isEmptyReports && (
                    <BasicEmptyListView image='/dino/searching@2x.png' spaceSize={16}>
                        <Typography.Title level={4}>{NoDataTitle}</Typography.Title>
                    </BasicEmptyListView>
                )}
            </Row>
        )
    }, [NoDataTitle, externalReports, organization, link, isDashboardEnabled])

    useEffect(() => {
        const canReadAnalytics = get(link, [ 'role', 'canReadAnalytics'], false)

        if (isDashboardEnabled && !canReadAnalytics) {
            replace('/ticket', undefined, { shallow: true })
        }
    }, [link, isDashboardEnabled, replace])

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitleMsg}</Typography.Title>} />
                <PageContent>
                    {loading ? <Loader size='large' fill /> : pageContent}
                </PageContent>
            </PageWrapper>
        </>
    )
}

IndexPage.requiredAccess = OrganizationRequired

export default IndexPage
