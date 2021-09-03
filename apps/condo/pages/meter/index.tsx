import Head from 'next/head'
import { PageContent, PageHeader, PageWrapper } from '../../domains/common/components/containers/BaseLayout'
import { Checkbox, Col, Input, notification, Row, Table, Typography } from 'antd'
import { EmptyListView } from '../../domains/common/components/EmptyListView'
import { Button } from '../../domains/common/components/Button'
import { DatabaseFilled } from '@ant-design/icons'
import { useState } from 'react'
import { useLazyQuery } from '@core/next/apollo'
import { EXPORT_TICKETS_TO_EXCEL } from '../../domains/ticket/gql'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import DateRangePicker from '../../domains/common/components/DateRangePicker'

const MetersPageContent = ({
    organization,
    role,
    meters,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.ticket.id.DownloadExcelLabel' })
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const router = useRouter()

    const [downloadLink, setDownloadLink] = useState(null)

    const [
        exportToExcel,
        { loading: isXlsLoading },
    ] = useLazyQuery(
        EXPORT_TICKETS_TO_EXCEL,
        {
            onError: error => {
                notification.error(error)
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        },
    )

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <PageContent>
                    {
                        !meters.length && !filtersFromQuery
                            ? <EmptyListView
                                label={EmptyListLabel}
                                message={EmptyListMessage}
                                createRoute='/meter/create'
                                createLabel={CreateTicket} />
                            : <Row gutter={[0, 40]} align={'middle'}>
                                <Col span={6}>
                                    <DateRangePicker />
                                </Col>
                                <Col span={4} offset={1}>
                                    <Checkbox
                                        onChange={handleEmergencyChange}
                                        checked={emergency}
                                        style={{ paddingLeft: '0px', fontSize: '16px' }}
                                    >{EmergencyLabel}</Checkbox>
                                </Col>
                                <Col span={6} push={1}>
                                    {
                                        downloadLink
                                            ?
                                            <Button
                                                type={'inlineLink'}
                                                icon={<DatabaseFilled />}
                                                loading={isXlsLoading}
                                                target='_blank'
                                                href={downloadLink}
                                                rel='noreferrer'>{DownloadExcelLabel}
                                            </Button>
                                            :
                                            <Button
                                                type={'inlineLink'}
                                                icon={<DatabaseFilled />}
                                                loading={isXlsLoading}
                                                onClick={
                                                    () => exportToExcel({ variables: { data: { where: searchTicketsQuery, sortBy: sortBy, timeZone } } })
                                                }>{ExportAsExcel}
                                            </Button>
                                    }
                                </Col>
                                <Col span={24}>
                                    <Table
                                    />
                                </Col>
                            </Row>
                    }
                </PageContent>
            </PageWrapper>
        </>
    )
}

const MetersPage = () => {

    return (
        <MetersPageContent />
    )
}

export default MetersPage