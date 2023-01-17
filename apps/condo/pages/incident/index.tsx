// todo(DOMA-2567) add translates
import React, { useCallback, useMemo } from 'react'
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
import { Incident, IncidentProperty, IncidentTicketClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IncidentWhereInput, SortIncidentsBy, Incident as IIncident } from '@app/condo/schema'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useRouter } from 'next/router'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useIncidentTableColumns, UseTableColumnsType } from '@condo/domains/ticket/hooks/useIncidentTableColumns'
import { useIncidentTableFilters } from '@condo/domains/ticket/hooks/useIncidentTableFilters'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import ActionBar from '@condo/domains/common/components/ActionBar'


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

const IS_ACTUAL_ATTRIBUTE_NAME = 'isActual'
const IS_NOT_ACTUAL_ATTRIBUTE_NAME = 'isNotActual'
const ATTRIBUTE_NAMES_TO_FILTERS = [IS_ACTUAL_ATTRIBUTE_NAME, IS_NOT_ACTUAL_ATTRIBUTE_NAME]

const INCIDENTS_DEFAULT_SORT_BY = ['createdAt_DESC']
const SORTABLE_PROPERTIES = ['number', 'status', 'details', 'createdAt', 'workStart', 'workFinish']

const FilterContainer: React.FC<FilterContainerProps> = (props) => {
    const { filterMetas } = props

    const SearchPlaceholderMessage = 'Поиск по адресу'
    const ActualLabel = 'Актуальные'
    const NotActualLabel = 'Неактуальные'

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

const TableContainer: React.FC<TableContainerProps> = (props) => {
    const AddNewIncidentLabel = 'AddNewIncidentLabel'

    const { useTableColumns, filterMetas, organizationId } = props

    const router = useRouter()
    const { filters, offset, sorters } = parseQuery(router.query)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, INCIDENTS_DEFAULT_SORT_BY) as SortIncidentsBy[]
    const incidentWhere = useMemo(() => ({ ...filtersToWhere(filters), deletedAt: null, organization: { id: organizationId } }),
        [filters, filtersToWhere, organizationId])
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const {
        loading: incidentsLoading,
        count,
        objs: incidents,
    } = Incident.useObjects({
        sortBy,
        where: incidentWhere,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
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
                totalRows={count}
                dataSource={incidents}
                columns={columns}
                loading={loading}
                sticky
                onRow={handleRowAction}
            />
        </Col>
    ), [columns, count, handleRowAction, loading, incidents])

    return (
        <>
            {IncidentsTable}
            <ActionBar>
                <Button
                    type='primary'
                    children={AddNewIncidentLabel}
                    onClick={handleAddNewIncident}
                />
                <Button
                    type='secondary'
                    children='Export'
                    onClick={handleAddNewIncident}
                />
            </ActionBar>
        </>
    )
}

const IncidentsPageContent: React.FC<IncidentsPageContentProps> = (props) => {
    const { filterMetas, useTableColumns, organizationId } = props

    const PageTitle = 'Журнал отключений'

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <TablePageContent>
                    <Row gutter={ROW_GUTTER} align='middle' justify='center'>
                        <FilterContainer filterMetas={filterMetas} />
                        <TableContainer
                            useTableColumns={useTableColumns}
                            filterMetas={filterMetas}
                            organizationId={organizationId}
                        />
                    </Row>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const IncidentsPage: IIncidentIndexPage = () => {
    const filterMetas = useIncidentTableFilters()
    const { organization } = useOrganization()
    const organizationId = get(organization, 'id')

    return <IncidentsPageContent
        organizationId={organizationId}
        filterMetas={filterMetas}
        useTableColumns={useIncidentTableColumns}
    />
}

IncidentsPage.requiredAccess = OrganizationRequired

export default IncidentsPage
