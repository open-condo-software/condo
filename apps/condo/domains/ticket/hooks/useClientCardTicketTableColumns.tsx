import { useMemo } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'

import { useIntl } from '@open-condo/next/intl'
import {
    getDateRender,
    getTableCellRenderer,
} from '@condo/domains/common/components/Table/Renders'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '../utils/helpers'
import {
    getClassifierRender,
    getStatusRender,
    getTicketDetailsRender,
} from '../utils/clientSchema/Renders'

export function useClientCardTicketTableColumns () {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage = intl.formatMessage({ id: 'Status' })
    const DescriptionMessage = intl.formatMessage({ id: 'Description' })
    const ClassifierTitle = intl.formatMessage({ id: 'Classifier' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const LastCommentMessage = intl.formatMessage({ id: 'pages.condo.phone.table.lastComment' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => ([
        {
            title: AddressMessage,
            dataIndex: ['property', 'address'],
            key: 'property',
            sorter: true,
            render: getTableCellRenderer(),
            filterIcon: getFilterIcon,
        },
        {
            title: NumberMessage,
            dataIndex: 'number',
            key: 'number',
            render: getTableCellRenderer(),
            align: 'center',
            width: '10%',
        },
        {
            title: DateMessage,
            filteredValue: getFilteredValue<IFilters>(filters, 'createdAt'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: getDateRender(intl),
            width: '10%',
        },
        {
            title: StatusMessage,
            sortOrder: get(sorterMap, 'status'),
            render: getStatusRender(intl),
            dataIndex: 'status',
            key: 'status',
            width: '10%',
        },
        {
            title: ClassifierTitle,
            dataIndex: ['classifier', 'category', 'name'],
            key: 'categoryClassifier',
            render: getClassifierRender(intl),
            ellipsis: true,
        },
        {
            title: DescriptionMessage,
            dataIndex: 'details',
            key: 'details',
            render: getTicketDetailsRender(),
        },
    ]), [AddressMessage, NumberMessage, DateMessage, filters, intl, StatusMessage, sorterMap, ClassifierTitle, DescriptionMessage])
}
