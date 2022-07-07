/** @jsx jsx */
import { jsx } from '@emotion/react'
import { DiffOutlined, FilterFilled } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import { Col, Row, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import Head from 'next/head'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'
import { useOrganization } from '@core/next/organization'
import { SortMeterReadingsBy } from '@app/condo/schema'
import { Gutter } from 'antd/es/grid/row'

import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import {
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MeterReading, MeterReadingFilterTemplate } from '@condo/domains/meter/utils/clientSchema'
import { getPageIndexFromOffset, getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { EXPORT_METER_READINGS_QUERY } from '@condo/domains/meter/gql'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useUpdateMeterModal } from '@condo/domains/meter/hooks/useUpdateMeterModal'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useFilters } from '@condo/domains/meter/hooks/useFilters'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { useImporterFunctions } from '@condo/domains/meter/hooks/useImporterFunction'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT, EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION } from '@condo/domains/meter/constants/errors'
import { DEFAULT_RECORDS_LIMIT_FOR_IMPORT, EXTENDED_RECORDS_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/import'
import isEmpty from 'lodash/isEmpty'

const METERS_PAGE_CONTENT_ROW_GUTTERS: [Gutter, Gutter] = [0, 40]

export const MetersPageContent = ({
    searchMeterReadingsQuery,
    tableColumns,
    sortBy,
    filterMetas,
    role,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const MeterReadingImportObjectsName = intl.formatMessage({ id: 'meter.import.MeterReading.objectsName.many' })
    const MeterReadingImportObjectsNameManyGenitive = intl.formatMessage({ id: 'meter.import.MeterReading.objectsName.many.genitive' })
    const MeterAccountNumberExistInOtherUnitMessage = intl.formatMessage({ id: 'meter.import.error.MeterAccountNumberExistInOtherUnit' })
    const MeterNumberExistInOrganizationMessage = intl.formatMessage({ id: 'meter.import.error.MeterNumberExistInOrganization' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const canManageMeterReadings = get(role, 'canManageMeterReadings', false)

    const {
        loading,
        count: total,
        objs: meterReadings,
        refetch,
    } = MeterReading.useNewObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const { shouldTableScroll, isSmall } = useLayoutContext()
    const [ search, handleSearchChange ] = useSearch(loading)
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch)
    const { MultipleFiltersModal, setIsMultipleFiltersModalVisible } = useMultipleFiltersModal(filterMetas, MeterReadingFilterTemplate)
    const [columns, meterReadingNormalizer, meterReadingValidator, meterReadingCreator] = useImporterFunctions()
    const isNoMeterData = isEmpty(meterReadings) && isEmpty(filters) && !loading

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                setSelectedMeter(meter)
            },
        }
    }, [setSelectedMeter])
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])
    const handleMultipleFiltersButtonClick = useCallback(() => setIsMultipleFiltersModalVisible(true),
        [setIsMultipleFiltersModalVisible])

    const mutationErrorsToMessages = useMemo(() => ({
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: MeterAccountNumberExistInOtherUnitMessage,
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: MeterNumberExistInOrganizationMessage,
    }), [MeterAccountNumberExistInOtherUnitMessage, MeterNumberExistInOrganizationMessage])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>}/>
                <TablePageContent>
                    <EmptyListView
                        label={EmptyListLabel}
                        message={''}
                        button={(
                            <ImportWrapper
                                objectsName={MeterReadingImportObjectsName}
                                accessCheck={canManageMeterReadings}
                                onFinish={refetch}
                                columns={columns}
                                maxTableLength={
                                    hasFeature('bigger_limit_for_import') ?
                                        EXTENDED_RECORDS_LIMIT_FOR_IMPORT :
                                        DEFAULT_RECORDS_LIMIT_FOR_IMPORT
                                }
                                rowNormalizer={meterReadingNormalizer}
                                rowValidator={meterReadingValidator}
                                objectCreator={meterReadingCreator}
                                domainTranslate={MeterReadingImportObjectsNameManyGenitive}
                                exampleTemplateLink={'/meter-import-example.xlsx'}
                                mutationErrorsToMessages={mutationErrorsToMessages}
                            >
                                <Button
                                    type={'sberPrimary'}
                                    icon={<DiffOutlined />}
                                    block
                                    secondary
                                />
                            </ImportWrapper>
                        )}
                        createRoute='/meter/create'
                        createLabel={CreateMeter}
                        containerStyle={{ display: isNoMeterData ? 'flex' : 'none' }}
                    />
                    <Row
                        gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                        align={'middle'}
                        justify={'center'}
                        hidden={isNoMeterData}
                    >
                        <Col span={24}>
                            <TableFiltersContainer>
                                <Row justify={'space-between'} gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}>
                                    <Col xs={24} lg={7}>
                                        <Input
                                            placeholder={SearchPlaceholder}
                                            onChange={handleSearch}
                                            value={search}
                                            allowClear
                                        />
                                    </Col>
                                    <Col>
                                        <Row gutter={[10, 0]} align={'middle'} justify={'center'}>
                                            {
                                                canManageMeterReadings && (
                                                    <Col>
                                                        <ImportWrapper
                                                            objectsName={MeterReadingImportObjectsName}
                                                            accessCheck={canManageMeterReadings}
                                                            onFinish={refetch}
                                                            columns={columns}
                                                            maxTableLength={hasFeature('bigger_limit_for_import') ?
                                                                EXTENDED_RECORDS_LIMIT_FOR_IMPORT :
                                                                DEFAULT_RECORDS_LIMIT_FOR_IMPORT
                                                            }
                                                            rowNormalizer={meterReadingNormalizer}
                                                            rowValidator={meterReadingValidator}
                                                            objectCreator={meterReadingCreator}
                                                            domainTranslate={MeterReadingImportObjectsNameManyGenitive}
                                                            exampleTemplateLink={'/meter-import-example.xlsx'}
                                                            mutationErrorsToMessages={mutationErrorsToMessages}
                                                        >
                                                            <Button
                                                                type={'sberPrimary'}
                                                                icon={<DiffOutlined />}
                                                                block
                                                                secondary
                                                            />
                                                        </ImportWrapper>
                                                    </Col>
                                                )
                                            }
                                            <Col>
                                                <Button
                                                    secondary
                                                    type={'sberPrimary'}
                                                    onClick={handleMultipleFiltersButtonClick}
                                                >
                                                    <FilterFilled/>
                                                    {FiltersButtonLabel}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </TableFiltersContainer>
                        </Col>
                        <Col span={24}>
                            <Table
                                scroll={getTableScrollConfig(shouldTableScroll)}
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
                            exportToExcelQuery={EXPORT_METER_READINGS_QUERY}
                            sortBy={sortBy}
                        />
                    </Row>
                    <UpdateMeterModal />
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

const sortableProperties = ['date', 'clientName', 'source']

const MetersPage: IMeterIndexPage = () => {
    const { organization, link } = useOrganization()
    const userOrganizationId = get(organization, 'id')
    const role = get(link, 'role')

    const filterMetas = useFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)
    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const tableColumns = useTableColumns(filterMetas)
    const searchMeterReadingsQuery = useMemo(() => ({
        meter: { deletedAt: null },
        ...filtersToWhere(filters),
        organization: { id: userOrganizationId } }),
    [filters, filtersToWhere, userOrganizationId])

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
