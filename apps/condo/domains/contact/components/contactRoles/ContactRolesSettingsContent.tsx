import { SortContactRolesBy } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import lowerCase from 'lodash/lowerCase'
import orderBy from 'lodash/orderBy'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useContactRolesTableColumns } from '@condo/domains/contact/hooks/useContactRolesTableColumns'
import { ContactRole } from '@condo/domains/contact/utils/clientSchema'


const SORTABLE_PROPERTIES = ['name']
const DEFAULT_SORT_BY = ['createdAt_DESC']

const StyledTable = styled(Table)`
  .ant-table-cell-ellipsis {
    white-space: inherit;
  }
`

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

export const ContactRolesSettingsContent = () => {
    const intl = useIntl()
    const AddMessage = intl.formatMessage({ id: 'ContactRoles.add' })

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const canManageContactRoles = useMemo(() => get(userOrganization, ['link', 'role', 'canManageContactRoles']), [userOrganization])

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers([], SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, DEFAULT_SORT_BY) as SortContactRolesBy[]

    const searchContactRolesQuery = useMemo(() => ({
        ...filtersToWhere(filters),
        OR: [
            { organization_is_null: true },
            { organization: { id: userOrganizationId } },
        ],
    }), [filters, userOrganizationId])

    const {
        loading: isRolesLoading,
        count: totalRoles,
        objs: roles,
    } = ContactRole.useObjects({
        sortBy,
        where: searchContactRolesQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const sortedRoles = useMemo(() => {
        const sorterByName = sorters.reduce((sorter, next) => {
            if (next.columnKey === 'name') {
                return next
            }
            return null
        }, null)

        if (sorterByName && roles.length > 0) {
            const isDesc = sorterByName.order === 'descend'
            return orderBy(roles, [({ name }) => lowerCase(name)], [isDesc ? 'desc' : 'asc'])
        }

        return roles

    }, [isRolesLoading, roles, sorters])

    const tableColumns = useContactRolesTableColumns([])

    const handleAddHintButtonClick = useCallback(async () => {
        if (!canManageContactRoles) {
            return
        }

        await router.push('/settings/contactRole/create')
    }, [router, canManageContactRoles])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/settings/contactRole/${record.id}`)
            },
        }
    }, [router])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <StyledTable
                    totalRows={totalRoles}
                    loading={isRolesLoading}
                    onRow={handleRowAction}
                    dataSource={sortedRoles}
                    columns={tableColumns}
                    data-cy='contactRoles__table'
                />
            </Col>
            {
                canManageContactRoles && (
                    <Col span={24}>
                        <ActionBar
                            actions={[
                                <Button
                                    key='submit'
                                    type='primary'
                                    onClick={handleAddHintButtonClick}
                                >
                                    {AddMessage}
                                </Button>,
                            ]}
                        />
                    </Col>
                )
            }
        </Row>
    )
}
