import React, { useCallback, useMemo } from 'react'
import { Typography } from 'antd'
import { get } from 'lodash'
import { useRouter } from 'next/router'

import { useIntl } from '@core/next/intl'

import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getDateRender,
    renderMeterReading,
    getTextRender,
    getTableCellRenderer, getAddressRender,
} from '@condo/domains/common/components/Table/Renders'
import { getUnitRender } from '@condo/domains/meter/utils/clientSchema/Renders'
import { EmptyTableCell } from '@condo/domains/common/components/Table/EmptyTableCell'
import { METER_READING_SOURCE_EXTERNAL_IMPORT_TYPE } from '@condo/domains/meter/constants/constants'

const renderMeterRecord = (record) => {
    const value1 = get(record, 'value1')
    const value2 = get(record, 'value2')
    const value3 = get(record, 'value3')
    const value4 = get(record, 'value4')
    const measure = get(record, ['meter', 'resource', 'measure'], '')
    const resourceId = get(record, ['meter', 'resource', 'id'])

    return renderMeterReading([value1, value2, value3, value4], resourceId, measure)
}

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const ClientNameMessage = intl.formatMessage({ id: 'Contact' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const MeterReadingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReadingDate' })
    const ServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const PlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.Place' })
    const MeterReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })
    const AutoMessage = intl.formatMessage({ id: 'pages.condo.meter.AutoPrefix' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const search = getFilteredValue(filters, 'search')

    const renderAddress = useCallback((_, meterReading) =>
        getAddressRender(get(meterReading, ['meter', 'property']), DeletedMessage, search),
    [DeletedMessage, search])

    const renderResource = useCallback((_, meterReading) => {
        const value = get(meterReading, ['meter', 'resource', 'name'])
        const isAutomatic = get(meterReading, ['meter', 'isAutomatic'], false)
        const isExternalSource = Boolean(get(meterReading, ['source', 'type']) === METER_READING_SOURCE_EXTERNAL_IMPORT_TYPE)

        return (
            <EmptyTableCell>
                <Typography.Text title={value}>
                    {value}
                </Typography.Text>
                {isAutomatic && isExternalSource && (
                    <Typography.Text type={'warning'}>
                        {` (${AutoMessage})`}
                    </Typography.Text>
                )}
            </EmptyTableCell>
        )
    }, [AutoMessage])

    return useMemo(() => {
        return [
            {
                title: MeterReadingDateMessage,
                sortOrder: get(sorterMap, 'date'),
                filteredValue: getFilteredValue(filters, 'date'),
                dataIndex: 'date',
                key: 'date',
                sorter: true,
                width: '10%',
                render: getDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'date'),
            },
            {
                title: AddressMessage,
                filteredValue: getFilteredValue(filters, 'address'),
                key: 'address',
                width: '18%',
                render: renderAddress,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                filterIcon: getFilterIcon,
            },
            {
                title: UnitMessage,
                filteredValue: getFilteredValue(filters, 'unitName'),
                key: 'unitName',
                dataIndex: ['meter', 'unitName'],
                width: '10%',
                render: getUnitRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'unitName'),
                filterIcon: getFilterIcon,
            },
            {
                title: ServiceMessage,
                ellipsis: true,
                filteredValue: getFilteredValue(filters, 'resource'),
                key: 'resource',
                width: '14%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'resource'),
                render: renderResource,
                filterIcon: getFilterIcon,
            },
            {
                title: AccountNumberMessage,
                filteredValue: getFilteredValue(filters, 'accountNumber'),
                dataIndex: ['meter', 'accountNumber'],
                key: 'accountNumber',
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'accountNumber'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: MeterNumberMessage,
                filteredValue: getFilteredValue(filters, 'number'),
                dataIndex: ['meter', 'number'],
                key: 'number',
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: PlaceMessage,
                filteredValue: getFilteredValue(filters, 'place'),
                dataIndex: ['meter', 'place'],
                key: 'place',
                width: '8%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'place'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: MeterReadingMessage,
                ellipsis: false,
                key: 'value',
                width: '15%',
                render: renderMeterRecord,
            },
            {
                title: ClientNameMessage,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '12%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
                render: getTableCellRenderer(search, true),
                filterIcon: getFilterIcon,
            },
            {
                title: SourceMessage,
                sortOrder: get(sorterMap, 'source'),
                filteredValue: getFilteredValue(filters, 'source'),
                dataIndex: ['source', 'name'],
                key: 'source',
                sorter: true,
                width: '12%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'source'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
        ]
    }, [
        intl,
        AccountNumberMessage,
        AddressMessage,
        ClientNameMessage,
        MeterNumberMessage,
        MeterReadingMessage,
        MeterReadingDateMessage,
        PlaceMessage,
        SourceMessage,
        ServiceMessage,
        UnitMessage,
        filterMetas,
        filters,
        search,
        sorterMap,
        renderAddress,
        renderResource,
    ])
}
