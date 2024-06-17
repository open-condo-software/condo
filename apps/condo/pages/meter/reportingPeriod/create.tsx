import { Col, Row, RowProps } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'
import { useIntl } from 'react-intl'

import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { MeterReportingPeriodForm } from '@condo/domains/meter/components/MeterReportingPeriodForm'
import { MeterReadAndManagePermissionRequired } from '@condo/domains/meter/components/PageAccess'
import { METER_TAB_TYPES, MeterReportingPeriod, METER_TYPES } from '@condo/domains/meter/utils/clientSchema'

const CREATE_REPORTING_PERIOD_PAGE_GUTTER: RowProps['gutter'] = [0, 16]

const MeterReportingPeriodCreatePage = (): JSX.Element => {
    const intl = useIntl()
    
    const PageTitle = intl.formatMessage({ id: 'meter.reportingPeriod.AddMeterReportingPeriod' })

    const router = useRouter()
    
    const action = MeterReportingPeriod.useCreate({}, () => router.push(`/meter?tab=${METER_TAB_TYPES.reportingPeriod}&type=${METER_TYPES.unit}`))

    return <>
        <Head>
            <title>{PageTitle}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <Row gutter={CREATE_REPORTING_PERIOD_PAGE_GUTTER}>
                    <Col span={24}>
                        <Typography.Title level={1}>{PageTitle}</Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Row gutter={CREATE_REPORTING_PERIOD_PAGE_GUTTER}>
                            <MeterReportingPeriodForm
                                mode='create'
                                action={action}
                            />
                        </Row>
                    </Col>
                </Row>
            </PageContent>
        </PageWrapper>
    </>
}

MeterReportingPeriodCreatePage.requiredAccess = MeterReadAndManagePermissionRequired

export default MeterReportingPeriodCreatePage