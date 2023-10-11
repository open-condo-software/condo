import { Col, Row, RowProps, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'
import { useIntl } from 'react-intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { MeterReportingPeriodForm } from '@condo/domains/meter/components/MeterReportingPeriodForm'
import { MeterReadAndManagePermissionRequired } from '@condo/domains/meter/components/PageAccess'
import { METER_PAGE_TYPES, MeterReportingPeriod } from '@condo/domains/meter/utils/clientSchema'

const CREATE_REPORTING_PERIOD_PAGE_GUTTER: RowProps['gutter'] = [0, 40]
const TITLE_MARGIN = { marginBottom: '20px' }

const MeterReportingPeriodCreatePage = () => {
    const intl = useIntl()
    
    const PageTitle = intl.formatMessage({ id: 'meter.reportingPeriod.AddMeterReportingPeriod' })

    const router = useRouter()
    
    const action = MeterReportingPeriod.useCreate({}, () => router.push(`/meter?tab=${METER_PAGE_TYPES.reportingPeriod}`))

    return <>
        <Head>
            <title>{PageTitle}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <Row gutter={CREATE_REPORTING_PERIOD_PAGE_GUTTER}>
                    <Col span={24}>
                        <Col span={24}>
                            <Typography.Title style={TITLE_MARGIN} level={1}>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={CREATE_REPORTING_PERIOD_PAGE_GUTTER}>
                                <MeterReportingPeriodForm
                                    mode='create'
                                    action={action}
                                />
                            </Row>
                        </Col>
                    </Col>
                </Row>
            </PageContent>
        </PageWrapper>
    </>
}

MeterReportingPeriodCreatePage.requiredAccess = MeterReadAndManagePermissionRequired

export default MeterReportingPeriodCreatePage