/** @jsx jsx */
import { jsx } from '@emotion/core'
import {
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MeterReading } from '@condo/domains/meter/utils/clientSchema'
import { DiffOutlined, FilterFilled } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import { Col, Input, Row, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import React, { useCallback, useState } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import { useOrganization } from '@core/next/organization'
import { SortMeterReadingsBy } from '@app/condo/schema'
import { getPageIndexFromOffset, getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { EXPORT_METER_READINGS } from '@condo/domains/meter/gql'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useMeterInfoModal } from '@condo/domains/meter/hooks/useMeterInfoModal'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useFilters } from '@condo/domains/meter/hooks/useFilters'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { useImporterFunctions } from '../../domains/meter/hooks/useImporterFunction'

export const MetersPageContent = ({
    searchMeterReadingsQuery,
    tableColumns,
    sortBy,
    filterMetas,
    role,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const MeterReadingImportObjectsName = intl.formatMessage({ id: 'meter.import.MeterReading.objectsName.many' })
    const MeterReadingImportObjectsNameManyGenitive = intl.formatMessage({ id: 'meter.import.MeterReading.objectsName.many.genitive' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const canManageMeterReadings = get(role, 'canManageMeterReadings', false)

    const {
        loading,
        count: total,
        objs: meterReadings,
        refetch,
    } = MeterReading.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
        
    })

    const { isSmall } = useLayoutContext()
    const [ search, handleSearchChange ] = useSearch(loading)
    const { MeterInfoModal, setIsMeterInfoModalVisible } = useMeterInfoModal()
    const [ selectedMeterId, setSelectedMeterId ] = useState<string>()
    const { MultipleFiltersModal, setIsMultipleFiltersModalVisible } = useMultipleFiltersModal(filterMetas)
    const [columns, meterReadingNormalizer, meterReadingValidator, meterReadingCreator, metersRowErrorsProcessor] = useImporterFunctions()

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
                <TablePageContent>
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
                                        <FocusContainer padding={'16px'}>
                                            <Row justify={'space-between'} gutter={[0, 40]}>
                                                <Col xs={24} lg={7}>
                                                    <Input
                                                        placeholder={SearchPlaceholder}
                                                        onChange={(e) => {handleSearchChange(e.target.value)}}
                                                        value={search}
                                                    />
                                                </Col>
                                                <Col>
                                                    <Row gutter={[10, 0]} align={'middle'} justify={'center'}>
                                                        <Col>
                                                            <ImportWrapper
                                                                objectsName={MeterReadingImportObjectsName}
                                                                accessCheck={canManageMeterReadings}
                                                                onFinish={refetch}
                                                                columns={columns}
                                                                rowNormalizer={meterReadingNormalizer}
                                                                rowValidator={meterReadingValidator}
                                                                objectCreator={meterReadingCreator}
                                                                domainTranslate={MeterReadingImportObjectsNameManyGenitive}
                                                                exampleTemplateLink={'/meter-import-example.xlsx'}
                                                                rowErrorProcessor={metersRowErrorsProcessor}
                                                            >
                                                                <Button
                                                                    type={'sberPrimary'}
                                                                    icon={<DiffOutlined />}
                                                                    block
                                                                    secondary
                                                                />
                                                            </ImportWrapper>
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

                                                </Col>
                                            </Row>
                                        </FocusContainer>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            scroll={getTableScrollConfig(isSmall)}
                                            totalRows={total}
                                            loading={loading}
                                            dataSource={meterReadings}
                                            columns={tableColumns}
                                            onRow={handleRowAction}
                                        />
                                    </Col>

                                    <ExportToExcelActionBar
                                        hidden={isSmall}
                                        searchObjectsQuery={searchMeterReadingsQuery}
                                        exportToExcelQuery={EXPORT_METER_READINGS}
                                        sortBy={sortBy}
                                    />
                                </Row>
                            )
                    }
                    <MeterInfoModal meterId={selectedMeterId} />
                    <MultipleFiltersModal />
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

interface IMeterIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const MetersPage: IMeterIndexPage = () => {
    const { organization, link } = useOrganization()
    const userOrganizationId = get(organization, 'id')
    const role = get(link, 'role')

    const filterMetas = useFilters()

    const sortableProperties = ['date', 'clientName', 'source']

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
            role={role}
        />
    )
}

MetersPage.requiredAccess = OrganizationRequired

export default MetersPage
