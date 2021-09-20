/** @jsx jsx */
import { jsx } from '@emotion/core'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MeterReading, MeterReadingSource, MeterResource } from '@condo/domains/meter/utils/clientSchema'
import { DatabaseFilled, FilterFilled } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import { useLazyQuery } from '@core/next/apollo'
import { Col, Form, Input, notification, Row, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { get } from 'lodash'
import React, { useCallback, useState } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import { useOrganization } from '@core/next/organization'
import { MeterReadingWhereInput, SortMeterReadingsBy } from '../../schema'
import {
    getDayGteFilter,
    getDayLteFilter,
    getDayRangeFilter,
    getFilter,
    getPageIndexFromOffset,
    getStringContainsFilter,
    parseQuery,
} from '@condo/domains/common/utils/tables.utils'
import { useTableColumns } from '../../domains/meter/hooks/useTableColumns'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '../../domains/common/hooks/useQueryMappers'
import { EXPORT_METER_READINGS } from '@condo/domains/meter/gql'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useMeterInfoModal } from '../../domains/meter/hooks/useMeterInfoModal'
import { useMultipleFiltersModal } from '../../domains/common/hooks/useMultipleFiltersModal'
import { searchOrganizationProperty } from '../../domains/ticket/utils/clientSchema/search'
import { ComponentType, FilterComponentSize, FiltersMeta } from '@condo/domains/common/utils/filters.utils'


export const ExportToExcelActionBar = ({
    searchMeterReadingsQuery,
    sortBy,
}) => {
    const intl = useIntl()
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.ticket.id.DownloadExcelLabel' })
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const [downloadLink, setDownloadLink] = useState(null)

    const [
        exportToExcel,
        { loading: isXlsLoading },
    ] = useLazyQuery(
        EXPORT_METER_READINGS,
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
        <Form.Item noStyle>
            <ActionBar>
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
                            type={'sberPrimary'}
                            secondary
                            icon={<DatabaseFilled />}
                            loading={isXlsLoading}
                            onClick={
                                () => exportToExcel({ variables: { data: { where: searchMeterReadingsQuery, sortBy: sortBy, timeZone } } })
                            }>{ExportAsExcel}
                        </Button>
                }
            </ActionBar>
        </Form.Item>
    )
}


interface ITicketIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

export const MetersPageContent = ({
    searchMeterReadingsQuery,
    tableColumns,
    sortBy,
    filterMetas,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const {
        loading,
        count: total,
        objs: meterReadings,
    } = MeterReading.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const [search, handleSearchChange] = useSearch(loading)
    const { MeterInfoModal, setIsMeterInfoModalVisible } = useMeterInfoModal()
    const [selectedMeterId, setSelectedMeterId] = useState<string>()
    const { MultipleFiltersModal, setIsMultipleFiltersModalVisible } = useMultipleFiltersModal(filterMetas)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                setSelectedMeterId(record.meter.id)
                setIsMeterInfoModalVisible(true)
            },
        }
    }, [])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>}/>
                <PageContent>
                    {
                        !meterReadings.length && !filters
                            ? (
                                <EmptyListView
                                    label={EmptyListLabel}
                                    message={EmptyListMessage}
                                    createRoute='/ticket/create'
                                    createLabel={CreateTicket} />
                            ) :
                            (
                                <Row gutter={[0, 40]} align={'middle'} justify={'center'}>
                                    <Col span={23}>
                                        <FocusContainer style={{ padding: '16px' }}>
                                            <Row justify={'space-between'}>
                                                <Col span={7}>
                                                    <Input
                                                        placeholder={SearchPlaceholder}
                                                        onChange={(e) => {handleSearchChange(e.target.value)}}
                                                        value={search}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Button
                                                        secondary
                                                        type={'sberPrimary'}
                                                        onClick={() => setIsMultipleFiltersModalVisible(true)}
                                                    >
                                                        <FilterFilled/>
                                                        {FiltersButtonLabel}
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </FocusContainer>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            totalRows={total}
                                            loading={loading}
                                            dataSource={meterReadings}
                                            columns={tableColumns}
                                            onRow={handleRowAction}
                                        />
                                    </Col>

                                    <ExportToExcelActionBar
                                        searchMeterReadingsQuery={searchMeterReadingsQuery}
                                        sortBy={sortBy}
                                    />
                                </Row>
                            )
                    }
                    <MeterInfoModal meterId={selectedMeterId} />
                    <MultipleFiltersModal />
                </PageContent>
            </PageWrapper>
        </>
    )
}

const MetersPage: ITicketIndexPage = () => {
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const addressFilter = getStringContainsFilter(['meter', 'property', 'address'])
    const accountNumberFilter = getStringContainsFilter(['meter', 'accountNumber'])
    const placeFilter = getStringContainsFilter(['meter', 'place'])
    const numberFilter = getStringContainsFilter(['meter', 'number'])
    const clientNameFilter = getStringContainsFilter('clientName')
    const readingDateGteFilter = getDayGteFilter('date')
    const readingDateLteFilter = getDayLteFilter('date')
    const readingDateRangeFilter = getDayRangeFilter('date')
    // const installationDateFilter = getDayRangeFilter(['meter', 'installationDate'])
    const sourceFilter = getFilter(['source', 'id'], 'array', 'string', 'in')
    const resourceFilter = getFilter(['meter', 'resource', 'id'], 'array', 'string', 'in')

    const { objs: sources } = MeterReadingSource.useObjects({})
    const sourcesOptions = sources.map(source => ({ label: source.name, value: source.id }))

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})
    const resourcesOptions = resources.map(resource => ({ label: resource.name, value: resource.id }))

    const filterMetas: Array<FiltersMeta<MeterReadingWhereInput>> = [
        {
            keyword: 'address',
            filters: [addressFilter],
            component: {
                type: ComponentType.GQLSelect,
                props: {
                    search: searchOrganizationProperty(userOrganizationId),
                    mode: 'multiple',
                    showArrow: true,
                    placeholder: 'Введите адрес',
                },
                modalFilterComponentWrapper: {
                    label: 'Адрес',
                    size: FilterComponentSize.Large,
                },
                columnFilterComponentWrapper: {
                    width: '400px',
                },
            },
        },
        {
            keyword: 'accountNumber',
            filters: [accountNumberFilter],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: 'Введите лицевой счет',
                },
                modalFilterComponentWrapper: {
                    label: 'Лицевой счет',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'clientName',
            filters: [clientNameFilter],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: 'Введите ФИО жителя',
                },
                modalFilterComponentWrapper: {
                    label: 'Житель',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'resource',
            filters: [resourceFilter],
            component: {
                type: ComponentType.Select,
                options: resourcesOptions,
                props: {
                    loading: resourcesLoading,
                    mode: 'multiple',
                    showArrow: true,
                    placeholder: 'Выберите услугу',
                },
                modalFilterComponentWrapper: {
                    label: 'Услуга',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'date',
            filters: [readingDateRangeFilter],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: ['Выбрать дату', null],
                },
                modalFilterComponentWrapper: {
                    label: 'Дата снятия',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'number',
            filters: [numberFilter],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: 'Ввести номер',
                },
                modalFilterComponentWrapper: {
                    label: 'Номер прибора',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'place',
            filters: [placeFilter],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: 'Выбрать место установки прибора',
                },
                modalFilterComponentWrapper: {
                    label: 'Место',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'source',
            filters: [sourceFilter],
            component: {
                type: ComponentType.Select,
                options: sourcesOptions,
                props: {
                    mode: 'multiple',
                    placeholder: 'Выбрать',
                },
                modalFilterComponentWrapper: {
                    label: 'Источник',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'verificationDate',
            filters: [readingDateGteFilter, readingDateLteFilter],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: ['Выбрать дату', null],
                },
                modalFilterComponentWrapper: {
                    label: 'Дата поверки',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'installationDate',
            filters: [readingDateGteFilter, readingDateLteFilter],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: ['Выбрать дату', null],
                },
                modalFilterComponentWrapper: {
                    label: 'Дата установки',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'commissioningDate',
            filters: [readingDateGteFilter, readingDateLteFilter],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: ['Выбрать дату', null],
                },
                modalFilterComponentWrapper: {
                    label: 'Дата ввода в эксплуатацию',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'sealingDate',
            filters: [readingDateGteFilter, readingDateLteFilter],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: ['Выбрать дату', null],
                },
                modalFilterComponentWrapper: {
                    label: 'Дата опломбирования',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'controlReadingDate',
            filters: [readingDateGteFilter, readingDateLteFilter],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: ['Выбрать дату', null],
                },
                modalFilterComponentWrapper: {
                    label: 'Дата контрольных показаний',
                    size: FilterComponentSize.Medium,
                },
            },
        },
        { keyword: 'search', filters: [addressFilter, accountNumberFilter, placeFilter], combineType: 'OR' },
    ]

    const sortableProperties = ['date', 'address', 'resource', 'number', 'place', 'value1', 'clientName', 'source']

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const tableColumns = useTableColumns(filterMetas)
    const searchMeterReadingsQuery = { ...filtersToWhere(filters), organization: { id: userOrganizationId } }

    return (
        <MetersPageContent
            tableColumns={tableColumns}
            searchMeterReadingsQuery={searchMeterReadingsQuery}
            sortBy={sortersToSortBy(sorters) as SortMeterReadingsBy[]}
            filterMetas={filterMetas}
        />
    )
}

// MetersPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.ControlRoom' }}/>
MetersPage.requiredAccess = OrganizationRequired

export default MetersPage
