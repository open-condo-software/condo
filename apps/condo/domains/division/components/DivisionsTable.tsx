import React, { useMemo } from 'react'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import qs from 'qs'

import { PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'
import { useTableColumns } from '@condo/domains/division/hooks/useTableColumns'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'

import { Col, Input, Row, Space, Typography } from 'antd'
import { Table } from '@condo/domains/common/components/Table'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DatabaseFilled, DiffOutlined } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import { getFilter, getPageIndexFromOffset, getSorterMap, parseQuery, QueryMeta } from '@condo/domains/common/utils/tables.utils'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { colors } from '@condo/domains/common/constants/style'


type BuildingTableProps = {
    onSearch?: (properties: Property.IPropertyUIState[]) => void
}

export default function DivisionPageViewTable (props: BuildingTableProps) {
    const intl = useIntl()

    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })

    const router = useRouter()

    const { organization, link: { role } } = useOrganization()

    const addressFilter = getFilter('address', 'single', 'string', 'contains_i')
    const unitsCountFilter = getFilter('unitsCount', 'single', 'number')

    const queryMetas: QueryMeta[] = [
        { keyword: 'address', filters: [addressFilter] },
        { keyword: 'search', filters: [addressFilter, unitsCountFilter], combineType: 'OR' },
    ]

    const { filters, sorters, offset } = parseQuery(router.query)

    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, ['address'])
    const sorterMap = getSorterMap(sorters)

    const tableColumns = useTableColumns(sorterMap, filters)
    const { loading, error, objs: divisions, count: total } = Division.useObjects({
        sortBy: sortersToSortBy(sorters),
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

    const filtersWithOrganizations = useMemo(() => ({ ...filtersToWhere(filters), organization: { id: organization.id } }), [filters, filtersToWhere, organization.id])
    // TODO(mrfoxpro): move to common
    const applyFiltersToQuery = (newFilters) => {
        const query = { ...router.query, filters: JSON.stringify(newFilters) }
        const newQuery = qs.stringify({ ...query }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
        router.replace(router.route + newQuery)
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
            <Col span={6} push={6} align={'right'}>
                {role?.canManageProperties ? (
                    <Space size={16}>
                        <Button
                            type={'sberPrimary'}
                            icon={<DiffOutlined />}
                            secondary />
                        <Button type='sberPrimary' onClick={() => router.push('/buildings/create')}>
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
                />
            </Col>
        </Row>)
}
