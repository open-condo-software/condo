import { PlusCircleOutlined } from '@ant-design/icons'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@condo/next/intl'
import { useOrganization } from '@condo/next/organization'
import { SortPropertyScopesBy } from '@app/condo/schema'

import Input from '@condo/domains/common/components/antd/Input'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { IFilters } from '@condo/domains/ticket/utils/helpers'
import { usePropertyScopeColumns } from '@condo/domains/scope/hooks/useTableColumns'
import { usePropertyScopeTableFilters } from '@condo/domains/scope/hooks/useTableFilters'
import { PropertyScope } from '@condo/domains/scope/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'

const SORTABLE_PROPERTIES = ['name']
const PROPERTY_SCOPES_DEFAULT_SORT_BY = ['createdAt_DESC']

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

export const PropertyScopeSettingsContent = () => {
    const intl = useIntl()
    const PropertyScopeTitle = intl.formatMessage({ id: 'TicketsVisibility' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CreatePropertyScopeMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.create' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const canManagePropertyScopes = useMemo(() => get(userOrganization, ['link', 'role', 'canManagePropertyScopes']), [userOrganization])

    const [search, handleSearchChange] = useSearch<IFilters>(false)

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const filtersMeta = usePropertyScopeTableFilters()

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, PROPERTY_SCOPES_DEFAULT_SORT_BY) as SortPropertyScopesBy[]

    const searchPropertyScopesQuery = useMemo(() => ({
        ...filtersToWhere(filters),
        organization: { id: userOrganizationId },
    }), [filters, filtersToWhere, userOrganizationId])

    const {
        loading: isPropertyScopesFetching,
        count: total,
        objs: propertyScopes,
    } = PropertyScope.useObjects({
        sortBy,
        where: searchPropertyScopesQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/settings/propertyScope/${record.id}/`)
            },
        }
    }, [router])

    const handleAddHintButtonClick = useCallback(async () => {
        await router.push('/settings/propertyScope/create')
    }, [router])

    const handleSearch = useCallback(e => {
        handleSearchChange(e.target.value)
    }, [handleSearchChange])

    const { columns: tableColumns, loading: tableColumnsLoading } = usePropertyScopeColumns(filtersMeta, propertyScopes)
    const loading = tableColumnsLoading || isPropertyScopesFetching

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{PropertyScopeTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row>
                        <Col span={10}>
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
                    loading={loading}
                    onRow={handleRowAction}
                    dataSource={propertyScopes}
                    columns={tableColumns}
                    data-cy='propertyScope__table'
                    pageSize={DEFAULT_PAGE_SIZE}
                />
            </Col>
            {
                canManagePropertyScopes && (
                    <Col span={24}>
                        <ActionBar>
                            <Button
                                type='sberDefaultGradient'
                                icon={<PlusCircleOutlined/>}
                                onClick={handleAddHintButtonClick}
                            >
                                {CreatePropertyScopeMessage}
                            </Button>
                        </ActionBar>
                    </Col>
                )
            }
        </Row>
    )
}