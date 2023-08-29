import { OrganizationEmployeeRole } from '@app/condo/schema'
import { Table } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'

import {
    ASSIGNED_TICKET_VISIBILITY,
    ORGANIZATION_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
    PROPERTY_TICKET_VISIBILITY,
} from '../constants/common'


interface IRolePermissionsData {
    roleID: string
    roleName: string

}

export function useEmployeeRolesTableColumns (roles): Array<Record<string, unknown>> {
    const intl = useIntl()

    return [
        {
            dataIndex: 'groupName',
            width: '20%',
            key: 'groupName',
        },
        ...roles.map(role => ({
            title: role.name,
            key: role.id,
            render: (text, record, index) => {
                return <div style={{ width: '100px' }} />
            },
        })),
        Table.EXPAND_COLUMN,
    ]
}
