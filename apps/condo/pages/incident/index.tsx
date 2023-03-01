import {
    IncidentWhereInput,
    SortIncidentsBy,
    Incident as IIncident,
    OrganizationWhereInput,
    PropertyWhereInput,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Checkbox, Button } from '@open-condo/ui'

import ActionBar from '@condo/domains/common/components/ActionBar'
import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import EmptyListView from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useExportToExcel } from '@condo/domains/common/hooks/useExportToExcel'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL } from '@condo/domains/ticket/constants/incident'
import { EXPORT_INCIDENTS_TO_EXCEL_QUERY } from '@condo/domains/ticket/gql'
import { useBooleanAttributesSearch } from '@condo/domains/ticket/hooks/useBooleanAttributesSearch'
import { useIncidentTableColumns, UseTableColumnsType } from '@condo/domains/ticket/hooks/useIncidentTableColumns'
import { useIncidentTableFilters } from '@condo/domains/ticket/hooks/useIncidentTableFilters'
import { Incident, IncidentProperty } from '@condo/domains/ticket/utils/clientSchema'
import { getFilterAddressForSearch } from '@condo/domains/ticket/utils/tables.utils'


export interface IIncidentIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

type FilterMetasType = Array<FiltersMeta<IncidentWhereInput>>
export type BaseQueryType = { organization: OrganizationWhereInput }

type IncidentsPageContentProps = {
    filterMetas: FilterMetasType
    useTableColumns: UseTableColumnsType
    baseQuery: BaseQueryType
    baseQueryLoading?: boolean
}

type FilterContainerProps = {
    filterMetas: FilterMetasType
}

type TableContainerProps = {
    filterMetas: FilterMetasType
    useTableColumns: UseTableColumnsType
    baseQuery: BaseQueryType
}


const ROW_GUTTER: RowProps['gutter'] = [0, 40]
const FILTER_ROW_GUTTER: RowProps['gutter'] = [24, 20]
const CHECKBOX_WRAPPER_GUTTERS: RowProps['gutter'] = [16, 16]
const SEARCH_WRAPPER_GUTTERS: RowProps['gutter'] = [20, 20]

const IS_ACTUAL_ATTRIBUTE_NAME = INCIDENT_STATUS_ACTUAL
const IS_NOT_ACTUAL_ATTRIBUTE_NAME = INCIDENT_STATUS_NOT_ACTUAL
const ATTRIBUTE_NAMES_TO_FILTERS = [IS_ACTUAL_ATTRIBUTE_NAME, IS_NOT_ACTUAL_ATTRIBUTE_NAME]

const INCIDENTS_DEFAULT_SORT_BY = ['status_ASC', 'workFinish_ASC', 'createdAt_DESC']
const SORTABLE_PROPERTIES = ['number', 'status', 'details', 'createdAt', 'workStart', 'workFinish']

const FilterContainer: React.FC<FilterContainerProps> = () => {
    const intl = useIntl()
    const SearchPlaceholderMessage = intl.formatMessage({ id: 'incident.index.filter.searchByAddress.placeholder' })
    const ActualLabel = intl.formatMessage({ id: 'incident.index.filter.attributes.actual.label' })
    const NotActualLabel = intl.formatMessage({ id: 'incident.index.filter.attributes.notActual.label' })

    const [search, changeSearch] = useSearch()
    const [attributes, handleChangeAttribute] = useBooleanAttributesSearch(ATTRIBUTE_NAMES_TO_FILTERS)
    const { [IS_ACTUAL_ATTRIBUTE_NAME]: isActual, [IS_NOT_ACTUAL_ATTRIBUTE_NAME]: isNotActual } = attributes

    const handleAttributeCheckboxChange = useCallback((attributeName: string) => (e: CheckboxChangeEvent) => {
        const isChecked = get(e, ['target', 'checked'])
        handleChangeAttribute(isChecked, attributeName)
    }, [handleChangeAttribute])

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        changeSearch(e.target.value)
    }, [changeSearch])

    return (
        <Col span={24}>
            <TableFiltersContainer>
                <Row gutter={FILTER_ROW_GUTTER} align='middle'>
                    <Col xs={24} md={8}>
                        <Row gutter={SEARCH_WRAPPER_GUTTERS}>
                            <Col span={24}>
                                <Input
                                    placeholder={SearchPlaceholderMessage}
                                    onChange={handleSearchChange}
                                    value={search}
                                    allowClear
                                    id='searchIncidents'
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={24} md={16}>
                        <Row gutter={CHECKBOX_WRAPPER_GUTTERS}>
                            <Col>
                                <Checkbox
                                    onChange={handleAttributeCheckboxChange(IS_ACTUAL_ATTRIBUTE_NAME)}
                                    checked={isActual}
                                    label={ActualLabel}
                                    id='changeFilterActualIncidents'
                                />
                            </Col>
                            <Col>
                                <Checkbox
                                    onChange={handleAttributeCheckboxChange(IS_NOT_ACTUAL_ATTRIBUTE_NAME)}
                                    checked={isNotActual}
                                    label={NotActualLabel}
                                    id='changeFilterNotActualIncidents'
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </TableFiltersContainer>
        </Col>
    )
}

const filterAddressForSearch = getFilterAddressForSearch()

const useIncidentsSearch = ({ baseQuery, filterMetas }) => {
    const router = useRouter()
    const { filters, offset, sorters } = useMemo(() => parseQuery(router.query), [router.query])
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const sortBy = useMemo(() => sortersToSortBy(sorters, INCIDENTS_DEFAULT_SORT_BY) as SortIncidentsBy[], [sorters, sortersToSortBy])

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { search } = filters as { search?: string }

    const [incidentsLoading, setIncidentsLoading] = useState(true)
    const [incidents, setIncidents] = useState<IIncident[]>([])
    const [count, setCount] = useState<number>(0)
    const [where, setWhere] = useState<IncidentWhereInput>({})

    const properties = Property.useAllObjects({}, { skip: true })
    const incidentProperties = IncidentProperty.useAllObjects({}, { skip: true, fetchPolicy: 'network-only' })
    const incident = Incident.useObjects({}, { fetchPolicy: 'network-only', skip: true })

    const incidentWhere = useMemo(() => ({
        ...baseQuery,
        ...filtersToWhere(filters),
        deletedAt: null,
    }),
    [filters, filtersToWhere, baseQuery])

    const getWhereByAddress = useCallback(async (search?: string) => {
        if (!search) {
            return { where: {} }
        }

        const propertyWhere = filterAddressForSearch(search) as { property: PropertyWhereInput }
        if (!propertyWhere) {
            return { where: {} }
        }

        const { data: { objs: foundedProperties, meta: { count: countProperties } } } = await properties.refetch({
            where: {
                ...baseQuery,
                ...propertyWhere.property,
                deletedAt: null,
            },
        })

        if (!countProperties) {
            return { where: null }
        }

        const { data: { objs: foundedIncidentProperties } } = await incidentProperties.refetch({
            where: {
                property: { id_in: foundedProperties.map(item => item.id) },
                deletedAt: null,
            },
        })

        const where: IncidentWhereInput[] = [
            { id_in: uniq(foundedIncidentProperties.map(item => item.incident.id)) },
        ]
        if (countProperties > 0) {
            where.push({ hasAllProperties: true })
        }

        return { where: { OR: where } }

    }, [baseQuery])

    const getIncidents = useCallback(async (incidentWhere, sortBy, currentPageIndex) => {
        const { data: { objs: incidents, meta: { count } } } = await incident.refetch({
            sortBy,
            where: incidentWhere,
            first: DEFAULT_PAGE_SIZE,
            skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
        })
        return { count, incidents }
    }, [])

    const searchIncidents = useCallback(async (currentPageIndex, incidentWhere, search, sortBy) => {
        setIncidentsLoading(true)
        const { where: whereByAddress } = await getWhereByAddress(search)
        let count = 0
        let incidents = []
        let where: IncidentWhereInput = {}
        if (whereByAddress) {
            where = {
                ...incidentWhere,
                ...whereByAddress,
            }
            const response = await getIncidents(where, sortBy, currentPageIndex)
            count = response.count
            incidents = response.incidents
        }
        setWhere(where)
        setCount(count)
        setIncidents(incidents)
        setIncidentsLoading(false)
    }, [getIncidents, getWhereByAddress])

    useEffect(() => {
        searchIncidents(currentPageIndex, incidentWhere, search, sortBy)
    }, [currentPageIndex, incidentWhere, search, sortBy, searchIncidents])

    return useMemo(() => ({
        incidentsLoading,
        incidents,
        count,
        sortBy,
        where,
    }), [count, incidents, incidentsLoading, sortBy, where])
}

const TableContainer: React.FC<TableContainerProps> = (props) => {
    const intl = useIntl()
    const AddNewIncidentLabel = intl.formatMessage({ id: 'incident.index.addNewIncident.label' })

    const { useTableColumns, filterMetas, baseQuery } = props

    const router = useRouter()

    const { incidentsLoading, incidents, count, sortBy, where } = useIncidentsSearch({ baseQuery, filterMetas })

    const { ExportButton } = useExportToExcel({
        searchObjectsQuery: where,
        sortBy,
        exportToExcelQuery: EXPORT_INCIDENTS_TO_EXCEL_QUERY,
        useTimeZone: true,
    })

    const { loading: columnsLoading, columns } = useTableColumns({ filterMetas, incidents })

    const loading = columnsLoading || incidentsLoading

    const handleRowAction: (record: IIncident, index?: number) => React.HTMLAttributes<HTMLElement> = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/incident/${record.id}`)
            },
        }
    }, [router])

    const handleAddNewIncident = useCallback(async () => {
        await router.push('/incident/create')
    }, [router])

    const IncidentsTable = useMemo(() => (
        <Col span={24}>
            <Table
                totalRows={loading ? 0 : count}
                dataSource={loading ? [] : incidents}
                columns={columns}
                loading={loading}
                sticky
                onRow={handleRowAction}
            />
        </Col>
    ), [count, incidents, columns, loading, handleRowAction])

    return (
        <>
            {IncidentsTable}
            {
                !loading && (
                    <ActionBar>
                        <Button
                            type='primary'
                            children={AddNewIncidentLabel}
                            onClick={handleAddNewIncident}
                            id='createIncident'
                        />
                        {Boolean(count) && <ExportButton id='exportToExcelIncidents' />}
                    </ActionBar>
                )
            }
        </>
    )
}

export const IncidentsPageContent: React.FC<IncidentsPageContentProps> = (props) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({  id: 'incident.index.title' })
    const EmptyListLabel = intl.formatMessage({  id: 'incident.index.emptyList.label' })
    const CreateIncidentLabel = intl.formatMessage({  id: 'incident.index.createIncident.label' })

    const { filterMetas, useTableColumns, baseQuery, baseQueryLoading = false } = props

    const {
        count: incidentTotal,
        loading: incidentTotalLoading,
    } = Incident.useCount({ where: { ...baseQuery } })

    const PageContet = useMemo(() => {
        if (baseQueryLoading || incidentTotalLoading) {
            return <Loader fill size='large' />
        }

        if (!incidentTotal) {
            return (
                <EmptyListView
                    label={EmptyListLabel}
                    createRoute='/incident/create'
                    createLabel={CreateIncidentLabel}
                />
            )
        }

        return (
            <Row gutter={ROW_GUTTER} align='middle' justify='center'>
                <FilterContainer filterMetas={filterMetas} />
                <TableContainer
                    useTableColumns={useTableColumns}
                    filterMetas={filterMetas}
                    baseQuery={baseQuery}
                />
            </Row>
        )
    }, [baseQueryLoading, incidentTotalLoading, incidentTotal, filterMetas, useTableColumns, baseQuery, EmptyListLabel, CreateIncidentLabel])

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <TablePageContent>
                    {PageContet}
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const IncidentsPage: IIncidentIndexPage = () => {
    const filterMetas = useIncidentTableFilters()
    const { organization } = useOrganization()
    const organizationId = get(organization, 'id')
    const baseQuery: BaseQueryType = useMemo(() => ({ organization: { id: organizationId } }), [organizationId])

    return (
        <IncidentsPageContent
            baseQuery={baseQuery}
            filterMetas={filterMetas}
            useTableColumns={useIncidentTableColumns}
        />
    )
}

IncidentsPage.requiredAccess = OrganizationRequired

export default IncidentsPage
