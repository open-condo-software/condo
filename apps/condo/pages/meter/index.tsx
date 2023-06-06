/** @jsx jsx */
import { SortMeterReadingsBy } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Col, Row, Tabs, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { FileDown, Filter } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import {
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { DEFAULT_RECORDS_LIMIT_FOR_IMPORT, EXTENDED_RECORDS_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/import'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import {
    MultipleFilterContextProvider,
    useMultipleFiltersModal,
} from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT, EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION } from '@condo/domains/meter/constants/errors'
import { EXPORT_METER_READINGS_QUERY } from '@condo/domains/meter/gql'
import { useFilters } from '@condo/domains/meter/hooks/useFilters'
import { useImporterFunctions } from '@condo/domains/meter/hooks/useImporterFunctions'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { useUpdateMeterModal } from '@condo/domains/meter/hooks/useUpdateMeterModal'
import {
    MeterReading,
    PropertyMeterReading,
    MeterReadingFilterTemplate,
    MeterTypes,
    METER_TYPES,
} from '@condo/domains/meter/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'


const METERS_PAGE_CONTENT_ROW_GUTTERS: [Gutter, Gutter] = [0, 40]

export const MetersPageContent = ({
    searchMeterReadingsQuery,
    tableColumns,
    sortBy,
    filterMetas,
    role,
    loading,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const MeterReadingImportObjectsName = intl.formatMessage({ id: 'meter.import.MeterReading.objectsName.many' })
    const MeterReadingImportObjectsNameManyGenitive = intl.formatMessage({ id: 'meter.import.MeterReading.objectsName.many.genitive' })
    const MeterAccountNumberExistInOtherUnitMessage = intl.formatMessage({ id: 'meter.import.error.MeterAccountNumberExistInOtherUnit' })
    const MeterNumberExistInOrganizationMessage = intl.formatMessage({ id: 'meter.import.error.MeterNumberExistInOrganization' })
    const ImportButtonMessage = intl.formatMessage({ id: 'containers.FormTableExcelImport.ClickOrDragImportFileHint' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const reduceNonEmpty = (cnt, filter) => cnt + Number((typeof filters[filter] === 'string' || Array.isArray(filters[filter])) && filters[filter].length > 0)
    const appliedFiltersCount = Object.keys(filters).reduce(reduceNonEmpty, 0)

    const canManageMeterReadings = get(role, 'canManageMeterReadings', false)

    const {
        loading: metersLoading,
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

    const { breakpoints } = useLayoutContext()
    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch)
    const { MultipleFiltersModal, setIsMultipleFiltersModalVisible, ResetFiltersModalButton } = useMultipleFiltersModal(filterMetas, MeterReadingFilterTemplate, handleSearchReset)
    const [columns, meterReadingNormalizer, meterReadingValidator, meterReadingCreator] = useImporterFunctions()
    const isNoMeterData = isEmpty(meterReadings) && isEmpty(filters) && !metersLoading && !loading

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

    const exampleTemplateLink = useMemo(() => `/meter-import-example-${intl.locale}.xlsx`, [intl.locale])

    return (
        <>
            <TablePageContent>
                <EmptyListView
                    label={EmptyListLabel}
                    message=''
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
                            exampleTemplateLink={exampleTemplateLink}
                            mutationErrorsToMessages={mutationErrorsToMessages}
                        >
                            <Button
                                type='secondary'
                                icon={<FileDown size='medium' />}
                            />
                        </ImportWrapper>
                    )}
                    createRoute={`/meter/create?meterType=${METER_TYPES.meter}`}
                    createLabel={CreateMeter}
                    containerStyle={{ display: isNoMeterData ? 'flex' : 'none' }}
                />
                <Row
                    gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                    align='middle'
                    justify='center'
                    hidden={isNoMeterData}
                >
                    <Col span={24}>
                        <TableFiltersContainer>
                            <Row justify='space-between' gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}>
                                <Col xs={24} lg={7}>
                                    <Input
                                        placeholder={SearchPlaceholder}
                                        onChange={handleSearch}
                                        value={search}
                                        allowClear
                                    />
                                </Col>
                                <Col>
                                    <Row gutter={[10, 0]} align='middle' justify='center'>
                                        {
                                            appliedFiltersCount > 0 ? (
                                                <Col>
                                                    <ResetFiltersModalButton />
                                                </Col>
                                            ) : null
                                        }
                                        <Col>
                                            <Button
                                                type='secondary'
                                                onClick={handleMultipleFiltersButtonClick}
                                                icon={<Filter size='medium'/>}
                                            >
                                                {
                                                    appliedFiltersCount > 0 ?
                                                        `${FiltersButtonLabel} (${appliedFiltersCount})`
                                                        : FiltersButtonLabel
                                                }
                                            </Button>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </TableFiltersContainer>
                    </Col>
                    <Col span={24}>
                        <Table
                            totalRows={total}
                            loading={metersLoading || loading}
                            dataSource={meterReadings}
                            columns={tableColumns}
                            onRow={handleRowAction}
                        />
                    </Col>
                    <Col span={24}>
                        <ExportToExcelActionBar
                            hidden={!breakpoints.TABLET_LARGE}
                            searchObjectsQuery={searchMeterReadingsQuery}
                            exportToExcelQuery={EXPORT_METER_READINGS_QUERY}
                            sortBy={sortBy}
                            actions={[
                                canManageMeterReadings && (
                                    <ImportWrapper
                                        key='import'
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
                                        exampleTemplateLink={exampleTemplateLink}
                                        mutationErrorsToMessages={mutationErrorsToMessages}
                                    >
                                        <Button
                                            type='secondary'
                                            icon={<FileDown size='medium' />}
                                        >
                                            {ImportButtonMessage}
                                        </Button>
                                    </ImportWrapper>
                                ),
                            ]}
                        />
                    </Col>
                </Row>
                <UpdateMeterModal />
                <MultipleFiltersModal />
            </TablePageContent>
        </>
    )
}

export const PropertyMetersPageContent = ({
    searchMeterReadingsQuery,
    tableColumns,
    sortBy,
    filterMetas,
    role,
    loading,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const canManageMeterReadings = get(role, 'canManageMeterReadings', false)

    const {
        loading: metersLoading,
        count: total,
        objs: PropertyMeterReadings,
        refetch,
    } = PropertyMeterReading.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const { breakpoints } = useLayoutContext()
    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch, METER_TYPES.propertyMeter)
    const isNoMeterData = isEmpty(PropertyMeterReadings) && isEmpty(filters) && !metersLoading && !loading

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                setSelectedMeter(meter)
            },
        }
    }, [setSelectedMeter])
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])

    return (
        <>
            <TablePageContent>
                <EmptyListView
                    label={EmptyListLabel}
                    message=''
                    createRoute={`/meter/create?meterType=${METER_TYPES.propertyMeter}`}
                    createLabel={CreateMeter}
                    containerStyle={{ display: isNoMeterData ? 'flex' : 'none' }}
                />
                <Row
                    gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                    align='middle'
                    justify='center'
                    hidden={isNoMeterData}
                >
                    <Col span={24}>
                        <TableFiltersContainer>
                            <Row justify='space-between' gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}>
                                <Col xs={24} lg={7}>
                                    <Input
                                        placeholder={SearchPlaceholder}
                                        onChange={handleSearch}
                                        value={search}
                                        allowClear
                                    />
                                </Col>
                            </Row>
                        </TableFiltersContainer>
                    </Col>
                    <Col span={24}>
                        <Table
                            totalRows={total}
                            loading={metersLoading || loading}
                            dataSource={PropertyMeterReadings}
                            columns={tableColumns}
                            onRow={handleRowAction}
                        />
                    </Col>
                </Row>
                <UpdateMeterModal />
            </TablePageContent>
        </>
    )
}

interface IMeterIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const sortableProperties = ['date', 'clientName', 'source']

const MetersPage: IMeterIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const MeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.meterTab' })
    const PropertyMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.propertyMeterTab' })

    const { organization, link, isLoading } = useOrganization()
    const userOrganizationId = get(organization, 'id')
    const role = get(link, 'role')

    const { GlobalHints } = useGlobalHints()

    const [tab, setTab] = useState<MeterTypes>(METER_TYPES.meter)

    const filterMetas = useFilters(tab)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)
    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const tableColumns = useTableColumns(filterMetas, tab)
    const searchMeterReadingsQuery = useMemo(() => ({
        ...filtersToWhere(filters),
        meter: { deletedAt: null },
        organization: { id: userOrganizationId } }),
    [filters, filtersToWhere, userOrganizationId])
    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortMeterReadingsBy[], [sorters, sortersToSortBy])


    const handleTabChange = useCallback((tab: MeterTypes) => {
        setTab(tab)
    }, [])

    return (
        <MultipleFilterContextProvider>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>}/>
                <Tabs activeKey={tab} onChange={handleTabChange}>
                    <Tabs.TabPane tab={MeterMessage} key={METER_TYPES.meter} />
                    <Tabs.TabPane tab={PropertyMeterMessage} key={METER_TYPES.propertyMeter} />
                </Tabs>
                {
                    tab === METER_TYPES.meter && (
                        <MetersPageContent
                            tableColumns={tableColumns}
                            searchMeterReadingsQuery={searchMeterReadingsQuery}
                            sortBy={sortBy}
                            filterMetas={filterMetas}
                            role={role}
                            loading={isLoading}
                        />
                    )
                }
                {
                    tab === METER_TYPES.propertyMeter && (
                        <PropertyMetersPageContent
                            tableColumns={tableColumns}
                            searchMeterReadingsQuery={searchMeterReadingsQuery}
                            sortBy={sortBy}
                            filterMetas={filterMetas}
                            role={role}
                            loading={isLoading}
                        />
                    )
                }

            </PageWrapper>
        </MultipleFilterContextProvider>
    )
}

MetersPage.requiredAccess = OrganizationRequired

export default MetersPage
