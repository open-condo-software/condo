import { Col, Row, RowProps, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'
import { useIntl } from 'react-intl'


import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { MeterReportingPeriodForm } from '@condo/domains/meter/components/MeterReportingPeriodForm'
import { MeterReportingPeriod } from '@condo/domains/meter/utils/clientSchema'

const CREATE_REPORTING_PERIOD_PAGE_GUTTER: RowProps['gutter'] = [0, 40]
const TITLE_MARGIN = { marginBottom: '20px' }

const MeterReportingPeriodUpdatePage = () => {
    const intl = useIntl()
    const { query: { id: reportingPeriodId }, push } = useRouter()

    const PageTitle = intl.formatMessage({ id: 'meter.reportingPeriod.editMeterReportingPeriod' })
    const NotFoundMsg = intl.formatMessage({ id: 'notFound' })
    const ServerErrorMsg = intl.formatMessage({ id: 'serverError' })

    const {
        obj: reportingPeriod,
        error: reportingPeriodError,
        loading: reportingPeriodLoading,
        refetch,
    } = MeterReportingPeriod.useObject(
        {
            where: {
                id: String(reportingPeriodId),
            },
        }, {
            fetchPolicy: 'network-only',
        }
    )

    const action = MeterReportingPeriod.useUpdate({})
    const submitAction = async (data) => {
        await action(data, reportingPeriod)
        await push('/meter')
    }
    
    const isNotFound = !reportingPeriodLoading && (!reportingPeriod)
    if (reportingPeriodError || reportingPeriodLoading || isNotFound) {
        const errorToPrint = reportingPeriodError ? ServerErrorMsg : isNotFound ? NotFoundMsg : null
        return <LoadingOrErrorPage loading={reportingPeriodLoading} error={errorToPrint}/>
    }
    return <>
        <Head>
            <title>{PageTitle}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <Row gutter={CREATE_REPORTING_PERIOD_PAGE_GUTTER}>
                    <Col span={24}>
                        <Typography.Title style={TITLE_MARGIN} level={1}>{PageTitle}</Typography.Title>
                        <Col span={24}>
                            <Row gutter={CREATE_REPORTING_PERIOD_PAGE_GUTTER}>
                                <MeterReportingPeriodForm
                                    mode='update'
                                    action={submitAction}
                                    reportingPeriodRecord={reportingPeriod}
                                />
                            </Row>
                        </Col>
                    </Col>
                </Row>
            </PageContent>
        </PageWrapper>
    </>
}
export default MeterReportingPeriodUpdatePage