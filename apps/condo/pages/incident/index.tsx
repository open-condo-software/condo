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
import intersection from 'lodash/intersection'
import uniq from 'lodash/uniq'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { Search } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Checkbox, Button, ActionBar } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { PageComponentType } from '@condo/domains/common/types'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { IncidentReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL } from '@condo/domains/ticket/constants/incident'
import { useBooleanAttributesSearch } from '@condo/domains/ticket/hooks/useBooleanAttributesSearch'
import { useIncidentExportToExcelTask } from '@condo/domains/ticket/hooks/useIncidentExportToExcelTask'
import { useIncidentTableColumns, UseTableColumnsType } from '@condo/domains/ticket/hooks/useIncidentTableColumns'
import { useIncidentTableFilters } from '@condo/domains/ticket/hooks/useIncidentTableFilters'
import { Incident, IncidentProperty } from '@condo/domains/ticket/utils/clientSchema'
import { getFilterAddressForSearch } from '@condo/domains/ticket/utils/tables.utils'


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


const CHECKBOX_WRAPPER_STYLES: CSSProperties = { flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden' }

const ROW_GUTTER: RowProps['gutter'] = [0, 40]
const FILTER_ROW_GUTTER: RowProps['gutter'] = [24, 20]
const CHECKBOX_WRAPPER_GUTTERS: RowProps['gutter'] = [16, 16]

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
                    <Col span={24}>
                        <Input
                            placeholder={SearchPlaceholderMessage}
                            onChange={handleSearchChange}
                            value={search}
                            allowClear
                            id='searchIncidents'
                            suffix={<Search size='medium' color={colors.gray[7]} />}
                        />
                    </Col>
                    <Col>
                        <Row gutter={CHECKBOX_WRAPPER_GUTTERS} align='middle' style={CHECKBOX_WRAPPER_STYLES}>
                            <Col>
                                <Checkbox
                                    onChange={handleAttributeCheckboxChange(IS_ACTUAL_ATTRIBUTE_NAME)}
                                    checked={isActual}
                                    children={ActualLabel}
                                    id='changeFilterActualIncidents'
                                />
                            </Col>
                            <Col>
                                <Checkbox
                                    onChange={handleAttributeCheckboxChange(IS_NOT_ACTUAL_ATTRIBUTE_NAME)}
                                    checked={isNotActual}
                                    children={NotActualLabel}
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

    const baseOrganizationIds = useMemo(() => {
        const baseOrganizationId = get(baseQuery, 'organization.id')
        return (baseOrganizationId ? [baseOrganizationId] : get(baseQuery, 'organization.id_in', [])) || []
    }, [baseQuery])

    const incidentWhere = useMemo(() => ({
        ...filtersToWhere(filters),
    }), [filters, filtersToWhere])

    const getWhereByAddress = useCallback(async (search?: string) => {
        if (!search) {
            return { where: { organization: { id_in: baseOrganizationIds } } }
        }

        const propertyWhere = filterAddressForSearch(search) as { property: PropertyWhereInput }
        if (!propertyWhere) {
            return { where: { organization: { id_in: baseOrganizationIds } } }
        }

        const { data: { objs: foundedProperties, meta: { count: countProperties } } } = await properties.refetch({
            where: {
                ...baseQuery,
                ...propertyWhere.property,
            },
        })

        if (!countProperties) {
            return { where: null }
        }

        const { data: { objs: foundedIncidentProperties } } = await incidentProperties.refetch({
            where: {
                property: { id_in: foundedProperties.map(item => item.id) },
            },
        })

        const whereOR: IncidentWhereInput['OR'] = [
            { id_in: uniq(foundedIncidentProperties.map(item => item.incident.id)) },
        ]
        if (countProperties > 0) {
            whereOR.push({ hasAllProperties: true })
        }
        const where: IncidentWhereInput = {
            organization: { id_in: intersection(uniq(foundedProperties.map(item => item.organization.id)), baseOrganizationIds) },
            OR: whereOR,
        }

        return { where }

    }, [baseOrganizationIds, baseQuery])

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

    const { user } = useAuth() as { user: { id: string } }
    const { link } = useOrganization()
    const router = useRouter()

    const { incidentsLoading, incidents, count, sortBy, where } = useIncidentsSearch({ baseQuery, filterMetas })

    const { ExportButton } = useIncidentExportToExcelTask({
        where,
        sortBy,
        user,
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

    const canManageIncidents = useMemo(() => get(link, ['role', 'canManageIncidents'], false), [link])

    return (
        <>
            {IncidentsTable}
            {
                !loading && (
                    <Col span={24}>
                        <ActionBar
                            actions={[
                                canManageIncidents && (
                                    <Button
                                        key='create'
                                        type='primary'
                                        children={AddNewIncidentLabel}
                                        onClick={handleAddNewIncident}
                                        id='createIncident'
                                    />
                                ),
                                Boolean(count) && <ExportButton key='export' id='exportToExcelIncidents' />,
                            ]}
                        />
                    </Col>
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

    const { link } = useOrganization()
    const canManageIncidents = useMemo(() => get(link, ['role', 'canManageIncidents'], false), [link])

    const { filterMetas, useTableColumns, baseQuery, baseQueryLoading = false } = props

    const {
        count: incidentTotal,
        loading: incidentTotalLoading,
    } = Incident.useCount({ where: { ...baseQuery } })

    const { GlobalHints } = useGlobalHints()

    const PageContet = useMemo(() => {
        if (baseQueryLoading || incidentTotalLoading) {
            return <Loader fill size='large' />
        }

        if (!incidentTotal) {
            return (
                <EmptyListContent
                    label={EmptyListLabel}
                    createRoute='/incident/create'
                    createLabel={CreateIncidentLabel}
                    accessCheck={canManageIncidents}
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
    }, [baseQueryLoading, incidentTotalLoading, incidentTotal, filterMetas, useTableColumns, baseQuery, EmptyListLabel, CreateIncidentLabel, canManageIncidents])

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <TablePageContent>
                    {PageContet}
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const IncidentsPage: PageComponentType = (props) => {
    const filterMetas = useIncidentTableFilters()
    const { organization, link } = useOrganization()
    const organizationId = get(organization, 'id')
    const employeeId = get(link, 'id')
    const baseQuery: BaseQueryType = useMemo(() => ({ organization: { id: organizationId } }), [organizationId])

    usePreviousSortAndFilters({ employeeSpecificKey: employeeId })

    return (
        <IncidentsPageContent
            baseQuery={baseQuery}
            filterMetas={filterMetas}
            useTableColumns={useIncidentTableColumns}
        />
    )
}

IncidentsPage.requiredAccess = IncidentReadPermissionRequired

export default IncidentsPage
