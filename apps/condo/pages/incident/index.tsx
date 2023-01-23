import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'

import { Typography, Checkbox, Button } from '@open-condo/ui'
import { useOrganization } from '@open-condo/next/organization'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { Col, Row, RowProps } from 'antd'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import Input from '@condo/domains/common/components/antd/Input'
import { useBooleanAttributesSearch } from '@condo/domains/ticket/hooks/useBooleanAttributesSearch'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import get from 'lodash/get'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { Incident, IncidentProperty } from '@condo/domains/ticket/utils/clientSchema'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IncidentWhereInput, SortIncidentsBy, Incident as IIncident } from '@app/condo/schema'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useRouter } from 'next/router'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useIncidentTableColumns, UseTableColumnsType } from '@condo/domains/ticket/hooks/useIncidentTableColumns'
import { useIncidentTableFilters } from '@condo/domains/ticket/hooks/useIncidentTableFilters'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL } from '@condo/domains/ticket/constants/incident'
import uniq from 'lodash/uniq'
import EmptyListView from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import { useIntl } from '@open-condo/next/intl'


interface IIncidentIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

type FilterMetasType = Array<FiltersMeta<IncidentWhereInput>>

type IncidentsPageContentProps = {
    filterMetas: FilterMetasType
    useTableColumns: UseTableColumnsType
    organizationId: string
}

type FilterContainerProps = {
    filterMetas: FilterMetasType
}

type TableContainerProps = {
    filterMetas: FilterMetasType
    useTableColumns: UseTableColumnsType
    organizationId: string
}


const ROW_GUTTER: RowProps['gutter'] = [0, 40]
const FILTER_ROW_GUTTER: RowProps['gutter'] = [24, 20]
const CHECKBOX_WRAPPER_GUTTERS: RowProps['gutter'] = [16, 16]

const IS_ACTUAL_ATTRIBUTE_NAME = INCIDENT_STATUS_ACTUAL
const IS_NOT_ACTUAL_ATTRIBUTE_NAME = INCIDENT_STATUS_NOT_ACTUAL
const ATTRIBUTE_NAMES_TO_FILTERS = [IS_ACTUAL_ATTRIBUTE_NAME, IS_NOT_ACTUAL_ATTRIBUTE_NAME]

const INCIDENTS_DEFAULT_SORT_BY = ['status_ASC', 'workFinish_ASC', 'createdAt_DESC']
const SORTABLE_PROPERTIES = ['number', 'status', 'details', 'createdAt', 'workStart', 'workFinish']

const FilterContainer: React.FC<FilterContainerProps> = (props) => {
    const intl = useIntl()
    const SearchPlaceholderMessage = intl.formatMessage({ id: 'incident.index.filter.searchByAddress.placeholder' })
    const ActualLabel = intl.formatMessage({ id: 'incident.index.filter.attributes.actual.label' })
    const NotActualLabel = intl.formatMessage({ id: 'incident.index.filter.attributes.notActual.label' })

    const { filterMetas } = props

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
                        <Row gutter={[20, 20]}>
                            <Col span={24}>
                                <Input
                                    placeholder={SearchPlaceholderMessage}
                                    onChange={handleSearchChange}
                                    value={search}
                                    allowClear
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
                                />
                            </Col>
                            <Col>
                                <Checkbox
                                    onChange={handleAttributeCheckboxChange(IS_NOT_ACTUAL_ATTRIBUTE_NAME)}
                                    checked={isNotActual}
                                    label={NotActualLabel}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </TableFiltersContainer>
        </Col>
    )
}

const useIncidentsSearch = ({ organizationId, filterMetas }) => {
    const router = useRouter()
    const { filters, offset, sorters } = useMemo(() => parseQuery(router.query), [router.query])
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, INCIDENTS_DEFAULT_SORT_BY) as SortIncidentsBy[]

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { search } = filters as { search?: string }

    const [incidentsLoading, setIncidentsLoading] = useState(true)
    const [incidents, setIncidents] = useState<IIncident[]>([])
    const [count, setCount] = useState<number>(0)

    const properties = Property.useAllObjects({}, { skip: true })
    const incidentProperties = IncidentProperty.useAllObjects({}, { skip: true, fetchPolicy: 'network-only' })
    const incident = Incident.useObjects({}, { fetchPolicy: 'network-only', skip: true })

    const incidentWhere = useMemo(() => ({
        ...filtersToWhere(filters),
        deletedAt: null,
        organization: { id: organizationId },
    }),
    [filters, filtersToWhere, organizationId])

    const getWhereByAddress = useCallback(async (search?: string) => {
        if (!search) {
            return { where: {} }
        }

        const { data: { objs: foundedProperties, meta: { count: countProperties } } } = await properties.refetch({
            where: {
                organization: { id: organizationId },
                address_contains_i: search,
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

    }, [organizationId])

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
        if (whereByAddress) {
            const response = await getIncidents({
                ...incidentWhere,
                ...whereByAddress,
            }, sortBy, currentPageIndex)
            count = response.count
            incidents = response.incidents
        }
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
    }), [count, incidents, incidentsLoading])
}

const TableContainer: React.FC<TableContainerProps> = (props) => {
    const intl = useIntl()
    const AddNewIncidentLabel = intl.formatMessage({ id: 'incident.index.addNewIncident.label' })

    const { useTableColumns, filterMetas, organizationId } = props

    const router = useRouter()

    const { incidentsLoading, incidents, count } = useIncidentsSearch({ organizationId, filterMetas })

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
            {!loading && <ActionBar>
                <Button
                    type='primary'
                    children={AddNewIncidentLabel}
                    onClick={handleAddNewIncident}
                />
                {/* todo(DOMA-2567) add export incidents */}
                {Boolean(count) && (
                    <Button
                        type='secondary'
                        children='Export'
                        onClick={() => console.warn('todo(DOMA-2567) add export incidents')}
                    />
                )}
            </ActionBar>}
        </>
    )
}

const IncidentsPageContent: React.FC<IncidentsPageContentProps> = (props) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({  id: 'incident.index.title' })
    const EmptyListLabel = intl.formatMessage({  id: 'incident.index.emptyList.label' })
    const CreateIncidentLabel = intl.formatMessage({  id: 'incident.index.createIncident.label' })

    const { filterMetas, useTableColumns, organizationId } = props

    const {
        count: incidentTotal,
        loading: incidentTotalLoading,
    } = Incident.useCount({ where: { organization: { id: organizationId } } })

    const PageContet = useMemo(() => {
        if (incidentTotalLoading) {
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
                    organizationId={organizationId}
                />
            </Row>
        )
    }, [CreateIncidentLabel, EmptyListLabel, filterMetas, incidentTotal, incidentTotalLoading, organizationId, useTableColumns])

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

    const { organization } = useOrganization()
    const organizationId = get(organization, 'id')

    const filterMetas = useIncidentTableFilters()

    return (
        <IncidentsPageContent
            organizationId={organizationId}
            filterMetas={filterMetas}
            useTableColumns={useIncidentTableColumns}
        />
    )
}

IncidentsPage.requiredAccess = OrganizationRequired

export default IncidentsPage
