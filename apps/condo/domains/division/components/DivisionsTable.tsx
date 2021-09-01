import React from 'react'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import qs from 'qs'

import { PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'
import { useTableColumns } from '@condo/domains/division/hooks/useTableColumns'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'

import { Col, Input, Row, Space, Typography } from 'antd'
import { Table } from '@condo/domains/common/components/Table/Index'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DatabaseFilled, DiffOutlined } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import { FilterType, getFilter, getPageIndexFromOffset, getSorterMap, parseQuery, QueryMeta } from '@condo/domains/common/utils/tables.utils'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { colors } from '@condo/domains/common/constants/style'
import { DivisionWhereInput, SortDivisionsBy } from '../../../schema'


type BuildingTableProps = {
    onSearch?: (properties: Division.IDivisionUIState[]) => void
}

export default function DivisionTable (props: BuildingTableProps) {
    const intl = useIntl()

    const CreateLabel = intl.formatMessage({ id: 'pages.condo.division.index.CreateDivisionButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })

    const router = useRouter()

    const { organization, link: { role } } = useOrganization()

    const nameFilter = getFilter('name', 'single', 'string', 'contains_i')
    const propertiesFilter = (search: string) => ({
        properties_some: {
            OR: [
                {
                    address_contains_i: search,
                },
                {
                    name_contains_i: search,
                },
            ],
        },
    })
    const responsibleFilter = (search: string) => ({
        responsible: {
            name_contains_i: search,
        },
    })
    const executorsFilter = (search: string) => ({
        executors_some: {
            name_contains_i: search,
        },
    })

    const queryMetas: QueryMeta<DivisionWhereInput>[] = [
        { keyword: 'name', filters: [nameFilter] },
        {
            keyword: 'search',
            filters: [
                nameFilter,
                propertiesFilter,
                responsibleFilter,
                executorsFilter,
            ],
            combineType: 'OR',
        },
    ]

    const { filters, sorters, offset } = parseQuery(router.query)

    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers<DivisionWhereInput>(queryMetas, ['name'])
    const sorterMap = getSorterMap(sorters)

    const tableColumns = useTableColumns(sorterMap, filters)
    const { loading, error, objs: divisions, count: total } = Division.useObjects({
        sortBy: sortersToSortBy(sorters) as SortDivisionsBy[],
        where: { ...filtersToWhere(filters), organization: { id: organization.id } },
        skip: (currentPageIndex - 1) * PROPERTY_PAGE_SIZE,
        first: PROPERTY_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
        onCompleted: () => {
            props.onSearch && props.onSearch(divisions)
        },
    })


    const handleRowAction = (record) => {
        return {
            onClick: () => {
                router.push(`/division/${record.id}/`)
            },
        }
    }

    // TODO(mrfoxpro): move to common
    const applyFiltersToQuery = (newFilters) => {
        const query = { ...router.query, filters: JSON.stringify(newFilters) }
        const newQuery = qs.stringify({ ...query }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
        router.push(router.route + newQuery)
    }

    const debouncedSearch = debounce((text) => {
        filters.search = text
        applyFiltersToQuery(filters)
    }, 400)

    if (error) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null} />
    }

    return (
        <Row align={'middle'} gutter={[0, 40]}>
            <Col span={6}>
                <Input

                    placeholder={SearchPlaceholder}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    defaultValue={filters.address}
                />
            </Col>
            <Col span={6} push={1}>
                <Tooltip title={NotImplementedYetMessage} >
                    <Typography.Text
                        style={{
                            opacity: 70,
                            color: colors.sberGrey[4],
                        }}
                    >
                        <Button
                            type={'inlineLink'}
                            icon={<DatabaseFilled />}
                            target='_blank'
                            rel='noreferrer'>{DownloadExcelLabel}
                        </Button>
                    </Typography.Text>
                </Tooltip>

            </Col>
            <Col span={6} push={6}>
                {role?.canManageProperties ? (
                    <Space size={16}>
                        <Button
                            type={'sberPrimary'}
                            icon={<DiffOutlined />}
                            secondary />
                        <Button type='sberPrimary' onClick={() => router.push('/division/create')}>
                            {CreateLabel}
                        </Button>
                    </Space>
                ) : null}
            </Col>
            <Col span={24}>
                <Table
                    totalRows={total}
                    loading={loading}
                    dataSource={divisions}
                    onRow={handleRowAction}
                    columns={tableColumns}
                    pageSize={PROPERTY_PAGE_SIZE}
                    staticQueryParams={['tab']}
                />
            </Col>
        </Row>)
}
