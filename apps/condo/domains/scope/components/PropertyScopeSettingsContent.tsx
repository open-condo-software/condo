import { SortPropertyScopesBy } from '@app/condo/schema'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'


import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { EXPORT_PROPERTY_SCOPE_QUERY } from '@condo/domains/scope/gql'
import { usePropertyScopeColumns } from '@condo/domains/scope/hooks/useTableColumns'
import { usePropertyScopeTableFilters } from '@condo/domains/scope/hooks/useTableFilters'
import { PropertyScope } from '@condo/domains/scope/utils/clientSchema'


const SORTABLE_PROPERTIES = ['name']
const PROPERTY_SCOPES_DEFAULT_SORT_BY = ['createdAt_DESC']

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

export const PropertyScopeSettingsContent = () => {
    const intl = useIntl()
    const PropertyScopeTitle = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.title' })
    const CreatePropertyScopeMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.create' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const { breakpoints } = useLayoutContext()

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
        count: total,
        objs: propertyScopes,
    } = PropertyScope.useObjects({
        sortBy,
        where: searchPropertyScopesQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const canManagePropertyScopes = useMemo(() => get(userOrganization, ['link', 'role', 'canManagePropertyScopes']), [userOrganization])

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

    const { columns: tableColumns, loading: tableColumnsLoading } = usePropertyScopeColumns(filtersMeta, propertyScopes)

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{PropertyScopeTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <Table
                    totalRows={total}
                    loading={tableColumnsLoading}
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
                        <ExportToExcelActionBar
                            hidden={!breakpoints.TABLET_LARGE}
                            searchObjectsQuery={searchPropertyScopesQuery}
                            sortBy={sortBy}
                            exportToExcelQuery={EXPORT_PROPERTY_SCOPE_QUERY}
                            useTimeZone={false}
                            actions={[
                                <Button
                                    key='createPropertyScope'
                                    id='PropertyScopeVisitCreate'
                                    type='primary'
                                    icon={<PlusCircle size='medium'/>}
                                    onClick={handleAddHintButtonClick}
                                >
                                    {CreatePropertyScopeMessage}
                                </Button>,
                            ]}
                        />
                    </Col>
                )
            }
        </Row>
    )
}