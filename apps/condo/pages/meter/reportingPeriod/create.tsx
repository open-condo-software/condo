import { Col, Row, RowProps, Typography } from 'antd'
import Head from 'next/head'
import React from 'React'
import { useIntl } from 'react-intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { CreateMeterReportingPeriodForm } from '@condo/domains/meter/components/CreateMeterReportingPeriodForm'

const CREATE_REPORTING_PERIOD_PAGE_GUTTER: RowProps['gutter'] = [0, 40]
const TITLE_MARGIN = { marginBottom: '20px' }

const MeterReportingPeriodCreatePage = () => {
    const intl = useIntl()
    
    const PageTitle = intl.formatMessage({ id: 'meter.reportingPeriod.AddMeterReportingPeriod' })

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
                                <CreateMeterReportingPeriodForm/>
                            </Row>
                        </Col>
                    </Col>
                </Row>
            </PageContent>
        </PageWrapper>
    </>
}
export default MeterReportingPeriodCreatePage